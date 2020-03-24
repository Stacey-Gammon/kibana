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

import { i18n } from '@kbn/i18n';
import {
  EmbeddableFactoryDefinition,
  ContainerInput,
  EmbeddableStart,
} from '../../../../src/plugins/embeddable/public';
import { LIST_CONTAINER, ListContainer } from './list_container';

interface StartServices {
  getEmbeddableFactory: EmbeddableStart['getEmbeddableFactory'];
}

export class ListContainerFactory implements EmbeddableFactoryDefinition {
  public readonly type = LIST_CONTAINER;
  public readonly isContainerType = true;

  constructor(private getStartServices: () => Promise<StartServices>) {}

  public async isEditable() {
    return true;
  }

  public async create(initialInput: ContainerInput) {
    const { getEmbeddableFactory } = await this.getStartServices();
    return new ListContainer(initialInput, getEmbeddableFactory);
  }

  public getDisplayName() {
    return i18n.translate('embeddableExamples.searchableListContainer.displayName', {
      defaultMessage: 'List container',
    });
  }
}
