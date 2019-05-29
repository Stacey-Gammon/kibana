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
jest.mock('ui/metadata', () => ({
  metadata: {
    branch: 'my-metadata-branch',
    version: 'my-metadata-version',
  },
}));

import { DEFAULT_PANEL_HEIGHT, DEFAULT_PANEL_WIDTH } from '../dashboard_constants';
import { DashboardPanelState } from '../types';
import { createPanelState } from './create_panel_state';
import { CONTACT_CARD_EMBEDDABLE } from '../../../../embeddable_api/public/__test__';
import { EmbeddableInput } from 'plugins/embeddable_api';

interface TestInput extends EmbeddableInput {
  test: string;
}
const panels: DashboardPanelState[] = [];

test('createPanelState adds a new panel state in 0,0 position', () => {
  const panelState = createPanelState<TestInput>(
    { embeddableId: '123', type: CONTACT_CARD_EMBEDDABLE, explicitInput: { test: 'hi' } },
    []
  );
  expect(panelState.explicitInput.test).toBe('hi');
  expect(panelState.type).toBe(CONTACT_CARD_EMBEDDABLE);
  expect(panelState.embeddableId).toBeDefined();
  expect(panelState.gridData.x).toBe(0);
  expect(panelState.gridData.y).toBe(0);
  expect(panelState.gridData.h).toBe(DEFAULT_PANEL_HEIGHT);
  expect(panelState.gridData.w).toBe(DEFAULT_PANEL_WIDTH);

  panels.push(panelState);
});

test('createPanelState adds a second new panel state', () => {
  const panelState = createPanelState<TestInput>(
    { embeddableId: '456', type: CONTACT_CARD_EMBEDDABLE, explicitInput: { test: 'bye' } },
    panels
  );
  expect(panelState.gridData.x).toBe(DEFAULT_PANEL_WIDTH);
  expect(panelState.gridData.y).toBe(0);
  expect(panelState.gridData.h).toBe(DEFAULT_PANEL_HEIGHT);
  expect(panelState.gridData.w).toBe(DEFAULT_PANEL_WIDTH);

  panels.push(panelState);
});

test('createPanelState adds a third new panel state', () => {
  const panelState = createPanelState<TestInput>(
    { embeddableId: '789', type: CONTACT_CARD_EMBEDDABLE, explicitInput: { test: 'bye' } },
    panels
  );
  expect(panelState.gridData.x).toBe(0);
  expect(panelState.gridData.y).toBe(DEFAULT_PANEL_HEIGHT);
  expect(panelState.gridData.h).toBe(DEFAULT_PANEL_HEIGHT);
  expect(panelState.gridData.w).toBe(DEFAULT_PANEL_WIDTH);

  panels.push(panelState);
});

test('createPanelState adds a new panel state in the top most position', () => {
  const panelsWithEmptySpace = panels.filter(panel => panel.gridData.x === 0);
  const panelState = createPanelState<TestInput>(
    { embeddableId: '987', type: CONTACT_CARD_EMBEDDABLE, explicitInput: { test: 'bye' } },
    panelsWithEmptySpace
  );
  expect(panelState.gridData.x).toBe(DEFAULT_PANEL_WIDTH);
  expect(panelState.gridData.y).toBe(0);
  expect(panelState.gridData.h).toBe(DEFAULT_PANEL_HEIGHT);
  expect(panelState.gridData.w).toBe(DEFAULT_PANEL_WIDTH);
});
