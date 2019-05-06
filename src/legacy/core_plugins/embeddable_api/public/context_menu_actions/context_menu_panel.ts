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

import { ReactElement } from 'react';
import { IEmbeddable } from '../embeddables';
import { ActionContext } from '../actions';

/**
 * Exposes information about the current state of the panel and the embeddable rendered internally.
 */
interface ContextMenuPanelOptions<E extends IEmbeddable> {
  getContent?: (context: ActionContext<E>) => ReactElement<any> | HTMLElement | undefined;
}

interface ContextMenuPanelConfig {
  id: string;
  title: string;
}

export class ContextMenuPanel<E extends IEmbeddable> {
  public readonly id: string;
  public readonly title: string;

  constructor(config: ContextMenuPanelConfig, options: ContextMenuPanelOptions<E> = {}) {
    this.id = config.id;
    this.title = config.title;

    if (options.getContent) {
      this.getContent = options.getContent;
    }
  }

  /**
   * Optional, could be composed of actions instead of content.
   */
  public getContent(context: ActionContext<E>): ReactElement<any> | HTMLElement | undefined {
    return;
  }
}
