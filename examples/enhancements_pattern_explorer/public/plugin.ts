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

import { CoreSetup, AppMountParameters, Plugin } from 'kibana/public';

import { GreetingStart, GreetingSetup } from 'examples/greeting/public';
import { getServices } from './services';

interface SetupDependencies {
  greeting: GreetingSetup;
}

interface StartDependencies {
  greeting: GreetingStart;
}

export class EnhancedPatternExplorerPlugin
  implements Plugin<void, void, SetupDependencies, StartDependencies> {
  setup(core: CoreSetup<StartDependencies>, { greeting }: SetupDependencies) {
    greeting.registerGreeting({ id: 'Casual', salutation: 'Hey there', punctuation: '.' });
    greeting.registerGreeting({ id: 'Excited', salutation: 'Hi', punctuation: '!!' });
    greeting.registerGreeting({ id: 'Formal', salutation: 'Hello ', punctuation: '.' });

    core.application.register({
      id: 'enhancingmentsPattern',
      title: 'Ennhancements pattern',
      async mount(params: AppMountParameters) {
        const { renderApp } = await import('./app');
        const [, depsStart] = await core.getStartServices();
        return renderApp(getServices({ greetingServices: depsStart.greeting }), params.element);
      },
    });
  }

  start() {}
}
