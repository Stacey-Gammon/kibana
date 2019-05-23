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

import '../doc_table';
import { capabilities } from 'ui/capabilities';
import { i18n } from '@kbn/i18n';
import {
  embeddableFactories,
  EmbeddableFactory,
  ErrorEmbeddable,
  Container,
} from 'plugins/embeddable_api/index';
import chrome from 'ui/chrome';
import { IPrivate } from 'ui/private';
// @ts-ignore
import { FilterManagerProvider } from 'ui/filter_manager';
import { SavedSearchLoader } from '../types';
import { SearchEmbeddable, SearchInput, SearchOutput, FilterManager } from './search_embeddable';

export const SEARCH_EMBEDDABLE_TYPE = 'search';

export class SearchEmbeddableFactory extends EmbeddableFactory<
  SearchInput,
  SearchOutput,
  SearchEmbeddable
> {
  public readonly type = SEARCH_EMBEDDABLE_TYPE;

  constructor() {
    super({
      savedObjectMetaData: {
        name: i18n.translate('kbn.discover.savedSearch.savedObjectName', {
          defaultMessage: 'Saved search',
        }),
        type: 'search',
        getIconForSavedObject: () => 'search',
      },
    });
  }

  public isEditable() {
    return capabilities.get().discover.save as boolean;
  }

  public canCreateNew() {
    return false;
  }

  public getDisplayName() {
    return i18n.translate('kbn.embeddable.search.displayName', {
      defaultMessage: 'search',
    });
  }

  public async createFromSavedObject(
    savedObjectId: string,
    input: Partial<SearchInput> & { id: string },
    parent?: Container
  ): Promise<SearchEmbeddable | ErrorEmbeddable> {
    const $injector = await chrome.dangerouslyGetActiveInjector();

    const $compile = $injector.get<ng.ICompileService>('$compile');
    const $rootScope = $injector.get<ng.IRootScopeService>('$rootScope');
    const courier = $injector.get<unknown>('courier');
    const searchLoader = $injector.get<SavedSearchLoader>('savedSearches');
    const editUrl = chrome.addBasePath(`/app/kibana${searchLoader.urlFor(savedObjectId)}`);

    const Private = $injector.get<IPrivate>('Private');
    const filterManager = Private<FilterManager>(FilterManagerProvider);

    // can't change this to be async / awayt, because an Anglular promise is expected to be returned.
    return searchLoader
      .get(savedObjectId)
      .then(savedObject => {
        return new SearchEmbeddable(
          {
            courier,
            savedSearch: savedObject,
            $rootScope,
            $compile,
            editUrl,
            filterManager,
            editable: capabilities.get().discover.save as boolean,
            indexPatterns: _.compact([savedObject.searchSource.getField('index')]),
          },
          input,
          parent
        );
      })
      .catch((e: Error) => {
        console.error(e); // eslint-disable-line no-console
        return new ErrorEmbeddable(e, input, parent);
      });
  }

  public async create(input: SearchInput) {
    return Promise.resolve(
      new ErrorEmbeddable('Saved searches can only be created from a saved object', input)
    );
  }
}

embeddableFactories.registerFactory(new SearchEmbeddableFactory());
