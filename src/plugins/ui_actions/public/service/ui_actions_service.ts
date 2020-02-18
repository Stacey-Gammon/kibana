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

import { TriggerRegistry, ActionRegistry, TriggerToActionsRegistry } from '../types';
import { Action } from '../actions';
import { Trigger, TriggerContextParams } from '../triggers/trigger';
import { TriggerInternal } from '../triggers/trigger_internal';
import { TriggerContract } from '../triggers/trigger_contract';

export interface UiActionsServiceParams {
  readonly triggers?: TriggerRegistry;
  readonly actions?: ActionRegistry;

  /**
   * A 1-to-N mapping from `Trigger` to zero or more `Action`.
   */
  readonly triggerToActions?: TriggerToActionsRegistry;
}

export class UiActionsService {
  protected readonly triggers: TriggerRegistry;
  protected readonly actions: ActionRegistry;
  protected readonly triggerToActions: TriggerToActionsRegistry;

  constructor({
    triggers = new Map(),
    actions = new Map(),
    triggerToActions = new Map(),
  }: UiActionsServiceParams = {}) {
    this.triggers = triggers;
    this.actions = actions;
    this.triggerToActions = triggerToActions;
  }

  public readonly registerTrigger = <T extends Trigger<any, any>>(trigger: T) => {
    if (this.triggers.has(trigger.id)) {
      throw new Error(`Trigger [trigger.id = ${trigger.id}] already registered.`);
    }

    const triggerInternal = new TriggerInternal(this, trigger);

    this.triggers.set(trigger.id, triggerInternal);
    this.triggerToActions.set(trigger.id, []);
  };

  public readonly getTrigger = <T = any>(id: string): TriggerContract<T> => {
    const trigger = this.triggers.get(id);

    if (!trigger) {
      throw new Error(`Trigger [triggerId = ${id}] does not exist.`);
    }

    return trigger.contract;
  };

  public readonly registerAction = (action: Action) => {
    if (this.actions.has(action.id)) {
      throw new Error(`Action [action.id = ${action.id}] already registered.`);
    }

    this.actions.set(action.id, action);
  };

  public readonly attachAction = (triggerId: string, actionId: string): void => {
    const trigger = this.triggers.get(triggerId);

    if (!trigger) {
      throw new Error(
        `No trigger [triggerId = ${triggerId}] exists, for attaching action [actionId = ${actionId}].`
      );
    }

    const actionIds = this.triggerToActions.get(triggerId);

    if (!actionIds!.find(id => id === actionId)) {
      this.triggerToActions.set(triggerId, [...actionIds!, actionId]);
    }
  };

  public readonly detachAction = (triggerId: string, actionId: string) => {
    const trigger = this.triggers.get(triggerId);

    if (!trigger) {
      throw new Error(
        `No trigger [triggerId = ${triggerId}] exists, for detaching action [actionId = ${actionId}].`
      );
    }

    const actionIds = this.triggerToActions.get(triggerId);

    this.triggerToActions.set(
      triggerId,
      actionIds!.filter(id => id !== actionId)
    );
  };

  public readonly getTriggerActions = (triggerId: string) => {
    // This line checks if trigger exists, otherwise throws.
    this.getTrigger!(triggerId);

    const actionIds = this.triggerToActions.get(triggerId);
    const actions = actionIds!
      .map(actionId => this.actions.get(actionId))
      .filter(Boolean) as Action[];

    return actions;
  };

  public readonly getTriggerCompatibleActions = async <C>(triggerId: string, context: C) => {
    const actions = this.getTriggerActions!(triggerId);
    const isCompatibles = await Promise.all(actions.map(action => action.isCompatible(context)));
    return actions.reduce<Action[]>(
      (acc, action, i) => (isCompatibles[i] ? [...acc, action] : acc),
      []
    );
  };

  /**
   * @deprecated
   *
   * Use `plugins.uiActions.getTrigger(triggerId).exec(params)` instead.
   */
  public readonly executeTriggerActions = async <T extends Trigger<any, any>>(
    triggerId: string,
    params: TriggerContextParams<T>
  ) => {
    const trigger = this.getTrigger<T>(triggerId);
    await trigger.exec(params);
  };

  /**
   * Removes all registered triggers and actions.
   */
  public readonly clear = () => {
    this.actions.clear();
    this.triggers.clear();
    this.triggerToActions.clear();
  };

  /**
   * "Fork" a separate instance of `UiActionsService` that inherits all existing
   * triggers and actions, but going forward all new triggers and actions added
   * to this instance of `UiActionsService` are only available within this instance.
   */
  public readonly fork = (): UiActionsService => {
    const triggers: TriggerRegistry = new Map();
    const actions: ActionRegistry = new Map();
    const triggerToActions: TriggerToActionsRegistry = new Map();

    for (const [key, value] of this.triggers.entries()) triggers.set(key, value);
    for (const [key, value] of this.actions.entries()) actions.set(key, value);
    for (const [key, value] of this.triggerToActions.entries())
      triggerToActions.set(key, [...value]);

    return new UiActionsService({ triggers, actions, triggerToActions });
  };
}
