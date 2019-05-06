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

jest.mock('ui/capabilities', () => ({
  uiCapabilities: {
    visualize: {
      save: true,
    },
  },
}));

import React from 'react';
import {
  GREETING_EMBEDDABLE,
  GreetingEmbeddableFactory,
  HelloWorldContainer,
  GreetingEmbeddableOutput,
  GreetingEmbeddable,
  GreetingEmbeddableInput,
} from '../../../../__test__/index';

// @ts-ignore
import { findTestSubject } from '@elastic/eui/lib/test';
import { CustomizePanelFlyout } from './customize_panel_flyout';
import { Container } from 'plugins/embeddable_api/containers';
import { EmbeddableFactoryRegistry, isErrorEmbeddable } from 'plugins/embeddable_api/embeddables';
import { mountWithIntl } from 'test_utils/enzyme_helpers';

let container: Container;
let embeddable: GreetingEmbeddable;

beforeEach(async () => {
  const embeddableFactories = new EmbeddableFactoryRegistry();
  embeddableFactories.registerFactory(new GreetingEmbeddableFactory());
  container = new HelloWorldContainer({ id: '123', panels: {} }, embeddableFactories);
  const greetingEmbeddable = await container.addNewEmbeddable<
    GreetingEmbeddableInput,
    GreetingEmbeddableOutput,
    GreetingEmbeddable
  >(GREETING_EMBEDDABLE, {
    firstName: 'Joe',
  });
  if (isErrorEmbeddable(greetingEmbeddable)) {
    throw new Error('Error creating new hello world embeddable');
  } else {
    embeddable = greetingEmbeddable;
  }
});

test('Is initialized with the embeddables title', async () => {
  const component = mountWithIntl(
    <CustomizePanelFlyout.WrappedComponent
      intl={null as any}
      embeddable={embeddable}
      updateTitle={() => {}}
    />
  );

  const inputField = findTestSubject(component, 'customDashboardPanelTitleInput').find('input');
  expect(inputField.props().value).toBe(embeddable.getOutput().title);
});

test('Calls updateTitle with a new title', async () => {
  const updateTitle = jest.fn();
  const component = mountWithIntl(
    <CustomizePanelFlyout.WrappedComponent
      intl={null as any}
      embeddable={embeddable}
      updateTitle={updateTitle}
    />
  );

  const inputField = findTestSubject(component, 'customDashboardPanelTitleInput').find('input');
  const event = { target: { value: 'new title' } };
  inputField.simulate('change', event);

  findTestSubject(component, 'saveNewTitleButton').simulate('click');

  expect(updateTitle).toBeCalledWith('new title');
});

test('Reset calls updateTitle with undefined', async () => {
  const updateTitle = jest.fn();
  const component = mountWithIntl(
    <CustomizePanelFlyout.WrappedComponent
      intl={null as any}
      embeddable={embeddable}
      updateTitle={updateTitle}
    />
  );

  const inputField = findTestSubject(component, 'customDashboardPanelTitleInput').find('input');
  const event = { target: { value: 'new title' } };
  inputField.simulate('change', event);

  findTestSubject(component, 'resetCustomDashboardPanelTitle').simulate('click');

  expect(updateTitle).toBeCalledWith(undefined);
});

test('Can set title to an empty string', async () => {
  const updateTitle = jest.fn();
  const component = mountWithIntl(
    <CustomizePanelFlyout.WrappedComponent
      intl={null as any}
      embeddable={embeddable}
      updateTitle={updateTitle}
    />
  );

  const inputField = findTestSubject(component, 'customDashboardPanelTitleInput').find('input');
  const event = { target: { value: '' } };
  inputField.simulate('change', event);

  findTestSubject(component, 'saveNewTitleButton').simulate('click');

  expect(updateTitle).toBeCalledWith('');
});
