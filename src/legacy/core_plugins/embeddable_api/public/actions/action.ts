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

import { EuiContextMenuItemIcon } from '@elastic/eui';
import { trackUiMetric } from '../../../ui_metric/public';

import { IEmbeddable } from '../embeddables';

export interface ExecuteActionContext<
  TEmbeddable extends IEmbeddable = IEmbeddable,
  TTriggerContext extends {} = {}
> {
  embeddable: TEmbeddable;
  triggerContext?: TTriggerContext;
}

export interface ActionContext<TEmbeddable extends IEmbeddable = IEmbeddable> {
  embeddable: TEmbeddable;
}

export abstract class Action<
  TEmbeddable extends IEmbeddable = IEmbeddable,
  TTriggerContext extends {} = {}
> {
  /**
   * Determined the order when there is more than one action matched to a trigger.
   * Higher numbers are displayed first.
   */
  public order: number = 0;
  public abstract readonly type: string;

  constructor(public readonly id: string) {
    trackUiMetric('EmbeddableAPI', `actionConstructor`);
  }

  /**
   * Optional icon that can be displayed along with the title.
   */
  public getIcon(context: ActionContext): EuiContextMenuItemIcon | undefined {
    return undefined;
  }

  /**
   * Returns a title to be displayed to the user.
   * @param context
   */
  public abstract getDisplayName(context: ActionContext): string;

  /**
   * Returns a promise that resolves to true if this action is compatible given the context,
   * otherwise resolves to false.
   */
  public isCompatible(context: ActionContext): Promise<boolean> {
    return Promise.resolve(true);
  }

  /**
   * If this returns something other than undefined, this is used instead of execute when clicked.
   */
  public getHref(context: ActionContext): string | undefined {
    return undefined;
  }

  /**
   * Executes the action.
   */
  public abstract execute(context: ExecuteActionContext<TEmbeddable, TTriggerContext>): void;
}
