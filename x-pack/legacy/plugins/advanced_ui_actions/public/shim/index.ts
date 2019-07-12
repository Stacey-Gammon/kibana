/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { npStart } from 'ui/new_platform';
import { PluginInitializerContext } from 'src/core/public';
import { embeddablePlugin } from '../../../../../../src/legacy/core_plugins/embeddable_api/public';
import { Plugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  const advancedUiActions = new Plugin(initializerContext);

  advancedUiActions.start(npStart.core, {
    embeddable: embeddablePlugin,
  });
}

plugin({} as any);
