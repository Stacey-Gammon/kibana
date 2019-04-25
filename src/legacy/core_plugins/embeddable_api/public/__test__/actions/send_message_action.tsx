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
import React from 'react';
import { getNewPlatform } from 'ui/new_platform';
import { EuiFlyoutBody } from '@elastic/eui';
import {
  Action,
  ActionContext,
  ExecuteActionContext,
  actionRegistry,
  IncompatibleActionError,
  triggerRegistry,
  CONTEXT_MENU_TRIGGER,
} from 'plugins/embeddable_api/index';
import { Embeddable, EmbeddableInput } from 'plugins/embeddable_api/embeddables';
import { GetMessageModal } from './get_message_modal';
import { FullNameEmbeddableOutput, hasFullNameOutput } from './say_hello_action';

export const SEND_MESSAGE_ACTION = 'SEND_MESSAGE_ACTION';

export class SendMessageAction extends Action {
  public readonly type = SEND_MESSAGE_ACTION;
  constructor() {
    super(SEND_MESSAGE_ACTION);
  }

  getDisplayName() {
    return 'Send message';
  }

  async isCompatible(
    context: ActionContext<Embeddable<EmbeddableInput, FullNameEmbeddableOutput>>
  ) {
    return hasFullNameOutput(context.embeddable);
  }

  async sendMessage(
    context: ExecuteActionContext<Embeddable<EmbeddableInput, FullNameEmbeddableOutput>>,
    message: string
  ) {
    const greeting = `Hello, ${context.embeddable.getOutput().fullName}`;

    const content = message ? `${greeting}. ${message}` : greeting;
    getNewPlatform().start.core.overlays.openFlyout(<EuiFlyoutBody>{content}</EuiFlyoutBody>);
  }

  async execute(
    context: ExecuteActionContext<
      Embeddable<EmbeddableInput, FullNameEmbeddableOutput>,
      { message?: string }
    >
  ) {
    if (!(await this.isCompatible(context))) {
      throw new IncompatibleActionError();
    }

    const modal = getNewPlatform().start.core.overlays.openModal(
      <GetMessageModal
        onCancel={() => modal.close()}
        onDone={message => {
          modal.close();
          this.sendMessage(context, message);
        }}
      />
    );
  }
}

actionRegistry.addAction(new SendMessageAction());
triggerRegistry.attachAction({ triggerId: CONTEXT_MENU_TRIGGER, actionId: SEND_MESSAGE_ACTION });
