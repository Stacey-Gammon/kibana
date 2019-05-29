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

jest.mock(
  'ui/chrome',
  () => ({
    getKibanaVersion: () => '6.3.0',
  }),
  { virtual: true }
);

jest.mock(
  'ui/notify',
  () => ({
    toastNotifications: {
      addDanger: () => {},
    },
  }),
  { virtual: true }
);

import { DEFAULT_PANEL_HEIGHT, DEFAULT_PANEL_WIDTH } from 'plugins/dashboard_embeddable';
import { parseVersion, convertPanelDataPre61, convertPanelDataPre63 } from './panel_utils';

test('parseVersion', () => {
  const { major, minor } = parseVersion('6.2.0');
  expect(major).toBe(6);
  expect(minor).toBe(2);
});

test('convertPanelDataPre61 gives supplies width and height when missing', () => {
  const panelData =
    {
      col: 3,
      id: 'foo1',
      row: 1,
      type: 'visualization',
      panelIndex: 1,
    };
  const newPanelData = convertPanelDataPre61(panelData, false);
  expect(newPanelData.gridData.w).toBe(DEFAULT_PANEL_WIDTH);
  expect(newPanelData.gridData.h).toBe(DEFAULT_PANEL_HEIGHT);
  expect(newPanelData.version).toBe('6.3.0');
});

test('convertPanelDataPre61 scales width and height', () => {
  const panelData =
    {
      col: 3,
      id: 'foo2',
      row: 1,
      size_x: 3,
      size_y: 2,
      type: 'visualization',
      panelIndex: 2,
    };
  const newPanelData = convertPanelDataPre61(panelData, false);
  expect(newPanelData.gridData.w).toBe(12);
  expect(newPanelData.gridData.h).toBe(10);
  expect(newPanelData.version).toBe('6.3.0');
});


test('convertPanelDataPre63 scales panel dimensions', () => {
  const oldPanel = {
    gridData: {
      h: 3,
      w: 7,
      x: 2,
      y: 5,
    },
    version: '6.2.0',
  };
  const updatedPanel = convertPanelDataPre63(oldPanel, false);
  expect(updatedPanel.gridData.w).toBe(28);
  expect(updatedPanel.gridData.h).toBe(15);
  expect(updatedPanel.gridData.x).toBe(8);
  expect(updatedPanel.gridData.y).toBe(25);
  expect(updatedPanel.version).toBe('6.3.0');
});

test('convertPanelDataPre_6_3 with margins scales panel dimensions', () => {
  const oldPanel = {
    gridData: {
      h: 3,
      w: 7,
      x: 2,
      y: 5,
    },
    version: '6.2.0',
  };
  const updatedPanel = convertPanelDataPre63(oldPanel, true);
  expect(updatedPanel.gridData.w).toBe(28);
  expect(updatedPanel.gridData.h).toBe(12);
  expect(updatedPanel.gridData.x).toBe(8);
  expect(updatedPanel.gridData.y).toBe(20);
  expect(updatedPanel.version).toBe('6.3.0');
});
