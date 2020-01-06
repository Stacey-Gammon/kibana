/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { IEmbeddableSetup, IEmbeddableStart } from '../../../../../src/plugins/embeddable/public';
import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  AppMountParameters,
} from '../../../../../src/core/public';
import {
  getBgSearchCollections,
  BackgroundSearchCollection,
} from '../../../../../x-pack/plugins/advanced_data/public';

export const REACT_ROOT_ID = 'embeddableExplorerRoot';

interface SetupDependencies {
  embeddable: IEmbeddableSetup; // Embeddable are needed because they register basic triggers/actions.
}

interface StartDependencies {
  embeddable: IEmbeddableStart;
}

export type Setup = void;
export type Start = void;

export class AdvancedEmbeddablePlugin
  implements Plugin<Setup, Start, SetupDependencies, StartDependencies> {
  constructor(initializerContext: PluginInitializerContext) {}

  public setup(core: CoreSetup<StartDependencies>, {}: SetupDependencies): Setup {
    // core.application.register({
    //   id: 'bgSearchExplorer',
    //   title: 'Background searches',
    //   async mount(params: AppMountParameters) {
    //     const [coreStart, depsStart] = await core.getStartServices();
    //     const { renderApp } = await import('./background_search_viewer');
    //     const bgSearchObjects = await getBgSearchCollections(coreStart.savedObjects.client);
    //     const bgSearches: BackgroundSearchCollection[] = bgSearchObjects.map(
    //       s => s.attributes as BackgroundSearchCollection
    //     );
    //     return renderApp(coreStart, depsStart.embeddable, bgSearches, params);
    //   },
    // });
  }

  public async start(core: CoreStart, plugins: StartDependencies): Promise<Start> {
    const { renderApp } = await import('./background_search_viewer');

    const bgSearchObjects = await getBgSearchCollections(core.savedObjects.client);
    const bgSearches: BackgroundSearchCollection[] = bgSearchObjects.map(
      s => s.attributes as BackgroundSearchCollection
    );
    renderApp(core, plugins.embeddable, bgSearchObjects, {
      appBasePath: 'app/background_search_viewer',
      element: document.getElementById(REACT_ROOT_ID),
    });
  }

  public stop() {}
}
