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
import { SavedObjectAttributes } from '../../../../../../../core/public';
import {
  Container,
  EmbeddableFactory,
  EmbeddableOutput,
  ErrorEmbeddable,
} from '../../../../../../../plugins/embeddable/public';
import { DisabledLabEmbeddable } from './disabled_lab_embeddable';
import { VisualizeEmbeddable, VisualizeInput, VisualizeOutput } from './visualize_embeddable';
import { Vis } from '../types';
import { VISUALIZE_EMBEDDABLE_TYPE } from './constants';
import {
  getCapabilities,
  getHttp,
  getTypes,
  getUISettings,
  getSavedVisualizationsLoader,
  getTimeFilter,
} from '../services';
import { showNewVisModal } from '../wizard';
import { convertToSerializedVis } from '../saved_visualizations/_saved_vis';

interface VisualizationAttributes extends SavedObjectAttributes {
  visState: string;
}

export class VisualizeEmbeddableFactory extends EmbeddableFactory<
  VisualizeInput,
  VisualizeOutput | EmbeddableOutput,
  VisualizeEmbeddable | DisabledLabEmbeddable,
  VisualizationAttributes
> {
  public readonly type = VISUALIZE_EMBEDDABLE_TYPE;

  constructor() {
    super({
      savedObjectMetaData: {
        name: i18n.translate('visualizations.savedObjectName', { defaultMessage: 'Visualization' }),
        includeFields: ['visState'],
        type: 'visualization',
        getIconForSavedObject: savedObject => {
          return (
            getTypes().get(JSON.parse(savedObject.attributes.visState).type).icon || 'visualizeApp'
          );
        },
        getTooltipForSavedObject: savedObject => {
          return `${savedObject.attributes.title} (${
            getTypes().get(JSON.parse(savedObject.attributes.visState).type).title
          })`;
        },
        showSavedObject: savedObject => {
          const typeName: string = JSON.parse(savedObject.attributes.visState).type;
          const visType = getTypes().get(typeName);
          if (!visType) {
            return false;
          }
          if (getUISettings().get('visualize:enableLabs')) {
            return true;
          }
          return visType.stage !== 'experimental';
        },
      },
    });
  }

  public async isEditable() {
    return getCapabilities().visualize.save as boolean;
  }

  public getDisplayName() {
    return i18n.translate('visualizations.displayName', {
      defaultMessage: 'visualization',
    });
  }

  public async createFromObject(
    vis: Vis,
    input: Partial<VisualizeInput> & { id: string },
    parent?: Container
  ): Promise<VisualizeEmbeddable | ErrorEmbeddable | DisabledLabEmbeddable> {
    const savedVisualizations = getSavedVisualizationsLoader();

    try {
      const visId = vis.id as string;

      const editUrl = visId
        ? getHttp().basePath.prepend(`/app/kibana${savedVisualizations.urlFor(visId)}`)
        : '';
      const isLabsEnabled = getUISettings().get<boolean>('visualize:enableLabs');

      if (!isLabsEnabled && vis.type.stage === 'experimental') {
        return new DisabledLabEmbeddable(vis.title, input);
      }

      const indexPattern = vis.data.indexPattern;
      const indexPatterns = indexPattern ? [indexPattern] : [];
      const editable = await this.isEditable();
      return new VisualizeEmbeddable(
        getTimeFilter(),
        {
          vis,
          indexPatterns,
          editUrl,
          editable,
          uiActions,
        },
        input,
        parent
      );
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
      return new ErrorEmbeddable(e, input, parent);
    }
  }

  public async createFromSavedObject(
    savedObjectId: string,
    input: Partial<VisualizeInput> & { id: string },
    parent?: Container
  ): Promise<VisualizeEmbeddable | ErrorEmbeddable | DisabledLabEmbeddable> {
    const savedVisualizations = getSavedVisualizationsLoader();

    try {
      const savedObject = await savedVisualizations.get(savedObjectId);
      const vis = new Vis(savedObject.visState.type, await convertToSerializedVis(savedObject));
      return this.createFromObject(vis, input, parent);
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
      return new ErrorEmbeddable(e, input, parent);
    }
  }

  public async create() {
    // TODO: This is a bit of a hack to preserve the original functionality. Ideally we will clean this up
    // to allow for in place creation of visualizations without having to navigate away to a new URL.
    showNewVisModal({
      editorParams: ['addToDashboard'],
    });
    return undefined;
  }
}
