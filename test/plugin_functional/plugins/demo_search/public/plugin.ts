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

import { DataPublicPluginSetup } from '../../../../../src/plugins/data/public';
import { Plugin, CoreSetup, PluginInitializerContext } from '../../../../../src/core/public';
import { DEMO_SEARCH_STRATEGY } from '../common';
import { demoClientSearchStrategyProvider } from './demo_search_strategy';
import { IDemoRequest, IDemoResponse } from '../common';

interface DemoDataSearchSetupDependencies {
  data: DataPublicPluginSetup;
}

declare module '../../../../../src/plugins/data/public' {
  export interface IRequestTypesMap {
    [DEMO_SEARCH_STRATEGY]: IDemoRequest;
  }

  export interface IResponseTypesMap {
    [DEMO_SEARCH_STRATEGY]: IDemoResponse;
  }
}

export class DemoDataPlugin implements Plugin {
  constructor(private initializerContext: PluginInitializerContext) {}
  public setup(core: CoreSetup, deps: DemoDataSearchSetupDependencies) {
    deps.data.search.registerSearchStrategyProvider(
      this.initializerContext.opaqueId,
      DEMO_SEARCH_STRATEGY,
      demoClientSearchStrategyProvider
    );
  }

  public start() {}
  public stop() {}
}
