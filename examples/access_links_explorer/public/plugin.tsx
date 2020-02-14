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

import { Plugin, CoreSetup, AppMountParameters } from '../../../src/core/public';
import { DirectAccessLinksStart } from '../../../src/plugins/direct_access_links/public';

interface StartDeps {
  directAccessLinks: DirectAccessLinksStart;
}

export class AccessLinksExplorerPlugin implements Plugin<void, void, {}, StartDeps> {
  public setup(core: CoreSetup<StartDeps>) {
    core.application.register({
      id: 'accessLinksExplorer',
      title: 'Access links explorer',
      async mount(params: AppMountParameters) {
        const depsStart = (await core.getStartServices())[1];
        const { renderApp } = await import('./app');
        return renderApp(
          {
            getLinkGenerator: depsStart.directAccessLinks.getAccessLinkGenerator,
          },
          params
        );
      },
    });
  }

  public start() {}

  public stop() {}
}
