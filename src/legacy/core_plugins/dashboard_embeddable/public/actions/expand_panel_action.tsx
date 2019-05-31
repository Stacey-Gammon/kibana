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

import { EuiIcon } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import {
  Action,
  actionRegistry,
  IEmbeddable,
  CONTEXT_MENU_TRIGGER,
  triggerRegistry,
  ActionContext,
  attachAction,
  IncompatibleActionError,
} from 'plugins/embeddable_api';
import React from 'react';
import { DASHBOARD_CONTAINER_TYPE, DashboardContainer } from '../embeddable';

export const EXPAND_PANEL_ACTION = 'togglePanel';

function isDashboard(
  embeddable: IEmbeddable | DashboardContainer
): embeddable is DashboardContainer {
  return (embeddable as DashboardContainer).type === DASHBOARD_CONTAINER_TYPE;
}

function isExpanded(embeddable: IEmbeddable) {
  if (!embeddable.parent || !isDashboard(embeddable.parent)) {
    throw new IncompatibleActionError();
  }

  return embeddable.id === embeddable.parent.getInput().expandedPanelId;
}

export class ExpandPanelAction extends Action {
  public readonly type = EXPAND_PANEL_ACTION;

  constructor() {
    super(EXPAND_PANEL_ACTION);
    this.order = 7;
  }

  public getDisplayName({ embeddable }: ActionContext) {
    if (!embeddable.parent || !isDashboard(embeddable.parent)) {
      throw new IncompatibleActionError();
    }

    return isExpanded(embeddable)
      ? i18n.translate('kbn.embeddable.actions.toggleExpandPanel.expandedDisplayName', {
          defaultMessage: 'Minimize',
        })
      : i18n.translate('kbn.embeddable.actions.toggleExpandPanel.notExpandedDisplayName', {
          defaultMessage: 'Full screen',
        });
  }

  public getIcon({ embeddable }: ActionContext) {
    if (!embeddable.parent || !isDashboard(embeddable.parent)) {
      throw new IncompatibleActionError();
    }
    // TODO: use 'minimize' when an eui-icon of such is available.
    return <EuiIcon type={isExpanded(embeddable) ? 'expand' : 'expand'} />;
  }

  public async isCompatible({ embeddable }: ActionContext) {
    return Boolean(embeddable.parent && isDashboard(embeddable.parent));
  }

  public execute({ embeddable }: ActionContext) {
    if (!embeddable.parent || !isDashboard(embeddable.parent)) {
      throw new IncompatibleActionError();
    }
    const newValue = isExpanded(embeddable) ? undefined : embeddable.id;
    embeddable.parent.updateInput({
      expandedPanelId: newValue,
    });
  }
}

actionRegistry.set(EXPAND_PANEL_ACTION, new ExpandPanelAction());

attachAction(triggerRegistry, {
  triggerId: CONTEXT_MENU_TRIGGER,
  actionId: EXPAND_PANEL_ACTION,
});
