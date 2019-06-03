/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import uuid from 'uuid';
import { i18n } from '@kbn/i18n';
import { Subscription } from 'rxjs';
import {
  Embeddable,
  EmbeddableInput,
  EmbeddableOutput,
  ErrorEmbeddable,
  EmbeddableFactory,
  EmbeddableFactoryNotFoundError,
} from '../embeddables';
import { IContainer, ContainerInput, ContainerOutput } from './i_container';
import { IEmbeddable } from '../embeddables/i_embeddable';
import { IRegistry } from '../types';

const getKeys = <T extends {}>(o: T): Array<keyof T> => Object.keys(o) as Array<keyof T>;

export interface PanelState<TEmbeddableInput extends EmbeddableInput = EmbeddableInput> {
  savedObjectId?: string;

  embeddableId: string;
  // The type of embeddable in this panel. Will be used to find the factory in which to
  // load the embeddable.
  type: string;

  // Stores input for this embeddable that is specific to this embeddable. Other parts of embeddable input
  // will be derived from the container's input. Any state in here will override any state derived from
  // the container.
  explicitInput: Partial<TEmbeddableInput>;
}
export abstract class Container<
  TChildInput extends Partial<EmbeddableInput> = {},
  TContainerInput extends ContainerInput = ContainerInput,
  TContainerOutput extends ContainerOutput = ContainerOutput
> extends Embeddable<TContainerInput, TContainerOutput>
  implements IContainer<TContainerInput, TContainerOutput> {
  public readonly isContainer: boolean = true;
  protected readonly children: {
    [key: string]: IEmbeddable<any, any> | ErrorEmbeddable;
  } = {};
  public readonly embeddableFactories: IRegistry<EmbeddableFactory>;

  private subscription: Subscription;

  constructor(
    input: TContainerInput,
    output: TContainerOutput,
    embeddableFactories: IRegistry<EmbeddableFactory>,
    parent?: Container
  ) {
    super(input, output, parent);
    this.embeddableFactories = embeddableFactories;
    this.subscription = this.getInput$().subscribe(() => this.maybeUpdateChildren());
  }

  public updateInputForChild<EEI extends EmbeddableInput = EmbeddableInput>(
    id: string,
    changes: Partial<EEI>
  ) {
    if (!this.input.panels[id]) {
      throw new Error(
        i18n.translate('embeddableApi.errors.paneldoesNotExist', {
          defaultMessage: 'Panel not found.',
        })
      );
    }
    const panels = {
      panels: {
        ...this.input.panels,
        [id]: {
          ...this.input.panels[id],
          explicitInput: {
            ...this.input.panels[id].explicitInput,
            ...changes,
          },
        },
      },
    };
    this.updateInput(panels as Partial<TContainerInput>);
  }

  public reload() {
    Object.values(this.children).forEach(child => child.reload());
  }

  public async addNewEmbeddable<
    EEI extends EmbeddableInput = EmbeddableInput,
    EEO extends EmbeddableOutput = EmbeddableOutput,
    E extends IEmbeddable<EEI, EEO> = IEmbeddable<EEI, EEO>
  >(type: string, explicitInput: Partial<EEI>): Promise<E | ErrorEmbeddable> {
    const factory = this.embeddableFactories.get(type) as
      | EmbeddableFactory<EEI, EEO, E>
      | undefined;

    if (!factory) {
      throw new EmbeddableFactoryNotFoundError(type);
    }

    const panelState = this.createNewPanelState<EEI, E>(factory, explicitInput);

    this.updateInput({
      panels: {
        ...this.input.panels,
        [panelState.embeddableId]: panelState,
      },
    } as Partial<TContainerInput>);

    return await this.untilEmbeddableLoaded<E>(panelState.embeddableId);
  }

  public async addSavedObjectEmbeddable<
    TEmbeddableInput extends EmbeddableInput = EmbeddableInput,
    TEmbeddable extends IEmbeddable<TEmbeddableInput> = IEmbeddable<TEmbeddableInput>
  >(type: string, savedObjectId: string): Promise<TEmbeddable | ErrorEmbeddable> {
    const factory = this.embeddableFactories.get(type) as EmbeddableFactory<
      TEmbeddableInput,
      any,
      TEmbeddable
    >;
    const panelState = this.createNewPanelState(factory);
    panelState.savedObjectId = savedObjectId;

    this.updateInput({
      panels: {
        ...this.input.panels,
        [panelState.embeddableId]: panelState,
      },
    } as Partial<TContainerInput>);

    return await this.untilEmbeddableLoaded<TEmbeddable>(panelState.embeddableId);
  }

  public removeEmbeddable(embeddableId: string) {
    // Just a shortcut for removing the panel from input state, all internal state will get cleaned up naturally
    // by the listener.
    const panels = { ...this.input.panels };
    delete panels[embeddableId];
    this.updateInput({ panels } as Partial<TContainerInput>);
  }

  public getChild<E extends IEmbeddable>(id: string): E {
    return this.children[id] as E;
  }

  public getInputForChild<TEmbeddableInput extends EmbeddableInput = EmbeddableInput>(
    embeddableId: string
  ): TEmbeddableInput {
    const containerInput: TChildInput = this.getInheritedInput(embeddableId);
    const panelState = this.getPanelState(embeddableId);

    const explicitInput = panelState.explicitInput;
    const explicitFiltered: { [key: string]: unknown } = {};

    const keys = getKeys(panelState.explicitInput);

    // If explicit input for a particular value is undefined, and container has that input defined,
    // we will use the inherited container input. This way children can set a value to undefined in order
    // to default back to inherited input. However, if the particular value is not part of the container, then
    // the caller may be trying to explicitly tell the child to clear out a given value, so in that case, we want
    // to pass it along.
    keys.forEach(key => {
      if (explicitInput[key] === undefined && containerInput[key] !== undefined) {
        return;
      }
      explicitFiltered[key] = explicitInput[key];
    });

    return ({
      ...containerInput,
      ...explicitFiltered,
      // Typescript has difficulties with inferring this type but it is accurate with all
      // tests I tried. Could probably be revisted with future releases of TS to see if
      // it can accurately infer the type.
    } as unknown) as TEmbeddableInput;
  }

  public destroy() {
    super.destroy();
    Object.values(this.children).forEach(child => child.destroy());
    this.subscription.unsubscribe();
  }

  public async untilEmbeddableLoaded<TEmbeddable extends IEmbeddable>(
    id: string
  ): Promise<TEmbeddable | ErrorEmbeddable> {
    return new Promise(resolve => {
      const subscription = this.getOutput$().subscribe(() => {
        if (this.output.embeddableLoaded[id]) {
          subscription.unsubscribe();
          resolve(this.children[id] as TEmbeddable);
        }
      });
    });
  }

  protected createNewPanelState<
    TEmbeddableInput extends EmbeddableInput,
    TEmbeddable extends IEmbeddable<TEmbeddableInput, any>
  >(
    factory: EmbeddableFactory<TEmbeddableInput, any, TEmbeddable>,
    partial: Partial<TEmbeddableInput> = {}
  ): PanelState<TEmbeddableInput> {
    const embeddableId = partial.id || uuid.v4();

    const explicitInput = this.createNewExplicitEmbeddableInput<TEmbeddableInput>(
      embeddableId,
      factory,
      partial
    );

    return {
      type: factory.type,
      embeddableId,
      explicitInput: {
        id: embeddableId,
        ...explicitInput,
      },
    };
  }

  protected getPanelState<TEmbeddableInput extends EmbeddableInput = EmbeddableInput>(
    embeddableId: string
  ) {
    if (this.input.panels[embeddableId] === undefined) {
      throw new Error(`No embeddable with id ${embeddableId}, this  ${JSON.stringify(this.input)}`);
    }
    const panelState: PanelState = this.input.panels[embeddableId];
    return panelState as PanelState<TEmbeddableInput>;
  }

  /**
   * Return state that comes from the container and is passed down to the child. For instance, time range and
   * filters are common inherited input state. Note that any state stored in `this.input.panels[embeddableId].explicitInput`
   * will override inherited input.
   */
  protected abstract getInheritedInput(id: string): TChildInput;

  private createNewExplicitEmbeddableInput<
    TEmbeddableInput extends EmbeddableInput = EmbeddableInput,
    TEmbeddable extends IEmbeddable<TEmbeddableInput, EmbeddableOutput> = IEmbeddable<
      TEmbeddableInput
    >
  >(
    id: string,
    factory: EmbeddableFactory<TEmbeddableInput, any, TEmbeddable>,
    partial: Partial<TEmbeddableInput> = {}
  ): Partial<TEmbeddableInput> {
    const inheritedInput = this.getInheritedInput(id);
    const defaults = factory.getDefaultInput(partial);

    // Container input overrides defaults.
    const explicitInput: Partial<TEmbeddableInput> = partial;

    getKeys(defaults).forEach(key => {
      // @ts-ignore We know this key might not exist on inheritedInput.
      const inheritedValue = inheritedInput[key];
      if (inheritedValue === undefined && explicitInput[key] === undefined) {
        explicitInput[key] = defaults[key];
      }
    });
    return explicitInput;
  }

  private onPanelRemoved(id: string) {
    // Clean up
    const embeddable = this.getChild(id);
    if (embeddable) {
      embeddable.destroy();

      // Remove references.
      delete this.children[id];
    }

    this.updateOutput({
      embeddableLoaded: {
        ...this.output.embeddableLoaded,
        [id]: undefined,
      },
    } as Partial<TContainerOutput>);
  }

  private async onPanelAdded(panel: PanelState) {
    this.updateOutput({
      embeddableLoaded: {
        ...this.output.embeddableLoaded,
        [panel.embeddableId]: false,
      },
    } as Partial<TContainerOutput>);
    let embeddable: IEmbeddable | ErrorEmbeddable | undefined;
    const inputForChild = this.getInputForChild(panel.embeddableId);
    try {
      const factory = this.embeddableFactories.get(panel.type);

      if (!factory) {
        throw new EmbeddableFactoryNotFoundError(panel.type);
      }

      embeddable = panel.savedObjectId
        ? await factory.createFromSavedObject(panel.savedObjectId, inputForChild, this)
        : await factory.create(inputForChild, this);
    } catch (e) {
      embeddable = new ErrorEmbeddable(e, { id: panel.embeddableId }, this);
    }

    // EmbeddableFactory.create can return undefined without throwing an error, which indicates that an embeddable
    // can't be created.  This logic essentially only exists to support the current use case of
    // visualizations being created from the add panel, which redirects the user to the visualize app. Once we
    // switch over to inline creation we can probably clean this up, and force EmbeddableFactory.create to always
    // return an embeddable, or throw an error.
    if (embeddable) {
      // The factory creation process may ask the user for input to update or override any input coming
      // from the container.
      const input = embeddable.getInput();
      const newOrChangedInput = getKeys(input)
        .filter(key => input[key] !== inputForChild[key])
        .reduce((res, key) => Object.assign(res, { [key]: input[key] }), {});

      if (embeddable.getOutput().savedObjectId || Object.keys(newOrChangedInput).length > 0) {
        this.updateInput({
          panels: {
            ...this.input.panels,
            [panel.embeddableId]: {
              ...this.input.panels[panel.embeddableId],
              ...(embeddable.getOutput().savedObjectId
                ? { savedObjectId: embeddable.getOutput().savedObjectId }
                : undefined),
              explicitInput: {
                ...this.input.panels[panel.embeddableId].explicitInput,
                ...newOrChangedInput,
              },
            },
          },
        } as Partial<TContainerInput>);
      }

      this.children[embeddable.id] = embeddable;
      this.updateOutput({
        embeddableLoaded: {
          ...this.output.embeddableLoaded,
          [panel.embeddableId]: true,
        },
      } as Partial<TContainerOutput>);
    } else if (embeddable === undefined) {
      this.removeEmbeddable(panel.embeddableId);
    }
    return embeddable;
  }

  private maybeUpdateChildren() {
    const allIds = Object.keys({ ...this.input.panels, ...this.output.embeddableLoaded });
    allIds.forEach(id => {
      if (this.input.panels[id] !== undefined && this.output.embeddableLoaded[id] === undefined) {
        this.onPanelAdded(this.input.panels[id]);
      } else if (
        this.input.panels[id] === undefined &&
        this.output.embeddableLoaded[id] !== undefined
      ) {
        this.onPanelRemoved(id);
      }
    });
  }
}
