/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import _ from 'lodash';
import chrome from 'ui/chrome';
import { capabilities } from 'ui/capabilities';
import { i18n } from '@kbn/i18n';
import { npSetup, npStart } from 'ui/new_platform';
import { SavedObjectLoader } from 'src/plugins/saved_objects/public';
import { IIndexPattern } from 'src/plugins/data/public';
import {
  EmbeddableFactory,
  ErrorEmbeddable,
  IContainer,
} from '../../../../../../src/legacy/core_plugins/embeddable_api/public/np_ready/public';
import { setup } from '../../../../../../src/legacy/core_plugins/embeddable_api/public/np_ready/public/legacy';
import { MapEmbeddable, MapEmbeddableInput } from './map_embeddable';
import { getIndexPatternService } from '../kibana_services';

import { createMapPath, MAP_SAVED_OBJECT_TYPE, APP_ICON } from '../../common/constants';
// eslint-disable-next-line @kbn/eslint/no-restricted-paths
import { createMapStore } from '../../../../../plugins/maps/public/reducers/store';
import { addLayerWithoutDataSync } from '../actions/map_actions';
import { getQueryableUniqueIndexPatternIds } from '../selectors/map_selectors';
import { getInitialLayers } from '../angular/get_initial_layers';
import { mergeInputWithSavedMap } from './merge_input_with_saved_map';
import '../angular/services/gis_map_saved_object_loader';
import { bindSetupCoreAndPlugins, bindStartCoreAndPlugins } from '../plugin';

export class MapEmbeddableFactory extends EmbeddableFactory {
  type = MAP_SAVED_OBJECT_TYPE;

  constructor() {
    super({
      savedObjectMetaData: {
        name: i18n.translate('xpack.maps.mapSavedObjectLabel', {
          defaultMessage: 'Map',
        }),
        type: MAP_SAVED_OBJECT_TYPE,
        getIconForSavedObject: () => APP_ICON,
      },
    });
    // Init required services. Necessary while in legacy
    bindSetupCoreAndPlugins(npSetup.core, npSetup.plugins);
    bindStartCoreAndPlugins(npStart.core, npStart.plugins);
  }

  async isEditable() {
    return capabilities.get().maps.save as boolean;
  }

  // Not supported yet for maps types.
  canCreateNew() {
    return false;
  }

  getDisplayName() {
    return i18n.translate('xpack.maps.embeddableDisplayName', {
      defaultMessage: 'map',
    });
  }

  async _getIndexPatterns(layerList: unknown[]): Promise<IIndexPattern[]> {
    // Need to extract layerList from store to get queryable index pattern ids
    const store = createMapStore();
    let queryableIndexPatternIds;
    try {
      layerList.forEach((layerDescriptor: unknown) => {
        store.dispatch(addLayerWithoutDataSync(layerDescriptor));
      });
      queryableIndexPatternIds = getQueryableUniqueIndexPatternIds(store.getState());
    } catch (error) {
      throw new Error(
        i18n.translate('xpack.maps.mapEmbeddableFactory.invalidLayerList', {
          defaultMessage: 'Unable to load map, malformed layer list',
        })
      );
    }

    const promises = queryableIndexPatternIds.map(async indexPatternId => {
      try {
        return await getIndexPatternService().get(indexPatternId);
      } catch (error) {
        // Unable to load index pattern, better to not throw error so map embeddable can render
        // Error will be surfaced by map embeddable since it too will be unable to locate the index pattern
        return null;
      }
    });
    const indexPatterns = await Promise.all(promises);
    return _.compact(indexPatterns) as IIndexPattern[];
  }

  async _fetchSavedMap(savedObjectId: string) {
    const $injector = await chrome.dangerouslyGetActiveInjector();
    const savedObjectLoader = $injector.get<SavedObjectLoader>('gisMapSavedObjectLoader');
    return await savedObjectLoader.get(savedObjectId);
  }

  async createFromSavedObject(
    savedObjectId: string,
    input: MapEmbeddableInput,
    parent?: IContainer
  ) {
    const savedMap = await this._fetchSavedMap(savedObjectId);
    const layerList = getInitialLayers(savedMap.layerListJSON);
    const indexPatterns = await this._getIndexPatterns(layerList);

    const embeddable = new MapEmbeddable(
      {
        layerList,
        title: savedMap.title,
        editUrl: chrome.addBasePath(createMapPath(savedObjectId)),
        indexPatterns,
        editable: await this.isEditable(),
      },
      input,
      parent
    );

    try {
      embeddable.updateInput(mergeInputWithSavedMap(input, savedMap));
    } catch (error) {
      throw new Error(
        i18n.translate('xpack.maps.mapEmbeddableFactory.invalidSavedObject', {
          defaultMessage: 'Unable to load map, malformed saved object',
        })
      );
    }

    return embeddable;
  }

  async createFromState(
    state: { title?: string; layerList?: unknown[] },
    input: MapEmbeddableInput,
    parent: IContainer,
    renderTooltipContent: (params: unknown) => React.ComponentType,
    eventHandlers: unknown
  ) {
    const layerList = state && state.layerList ? state.layerList : getInitialLayers();
    const indexPatterns = await this._getIndexPatterns(layerList);

    return new MapEmbeddable(
      {
        layerList,
        title: state && state.title ? state.title : '',
        indexPatterns,
        editable: false,
      },
      input,
      parent,
      renderTooltipContent,
      eventHandlers
    );
  }

  async create(input: MapEmbeddableInput) {
    window.location.href = chrome.addBasePath(createMapPath(''));
    return new ErrorEmbeddable(
      'Maps can only be created with createFromSavedObject or createFromState',
      input
    );
  }
}

setup.registerEmbeddableFactory(MAP_SAVED_OBJECT_TYPE, new MapEmbeddableFactory());
