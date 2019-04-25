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
import React from 'react';
jest.mock('ui/metadata', () => ({
  metadata: {
    branch: 'my-metadata-branch',
    version: 'my-metadata-version',
  },
}));

import {
  EmbeddableFactoryRegistry,
  isErrorEmbeddable,
  ViewMode,
  actionRegistry,
  triggerRegistry,
  CONTEXT_MENU_TRIGGER,
} from 'plugins/embeddable_api/index';
import { DashboardContainer } from './dashboard_container';
import { getSampleDashboardInput, getSampleDashboardPanel } from '../__test__';
import { mount } from 'enzyme';
import { nextTick } from 'test_utils/enzyme_helpers';

// @ts-ignore
import { findTestSubject } from '@elastic/eui/lib/test';
import { EmbeddablePanel } from 'plugins/embeddable_api/panel';
import { I18nProvider } from '@kbn/i18n/react';
import {
  ContactCardEmbeddableOutput,
  EditModeAction,
  ContactCardEmbeddable,
  ContactCardEmbeddableInput,
  CONTACT_CARD_EMBEDDABLE,
  ContactCardEmbeddableFactory,
} from 'plugins/embeddable_api/__test__';

test('DashboardContainer initializes embeddables', async done => {
  const embeddableFactories = new EmbeddableFactoryRegistry();
  embeddableFactories.registerFactory(new ContactCardEmbeddableFactory());
  const container = new DashboardContainer(
    getSampleDashboardInput({
      panels: {
        '123': getSampleDashboardPanel<ContactCardEmbeddableInput>({
          embeddableId: '123',
          explicitInput: { firstName: 'Sam' },
          type: CONTACT_CARD_EMBEDDABLE,
        }),
      },
    }),
    embeddableFactories
  );

  const subscription = container.getOutput$().subscribe(output => {
    if (container.getOutput().embeddableLoaded['123']) {
      const embeddable = container.getChild<ContactCardEmbeddable>('123');
      expect(embeddable).toBeDefined();
      expect(embeddable.id).toBe('123');
      done();
    }
  });

  if (container.getOutput().embeddableLoaded['123']) {
    const embeddable = container.getChild<ContactCardEmbeddable>('123');
    expect(embeddable).toBeDefined();
    expect(embeddable.id).toBe('123');
    subscription.unsubscribe();
    done();
  }
});

test('DashboardContainer.addNewEmbeddable', async () => {
  const embeddableFactories = new EmbeddableFactoryRegistry();
  embeddableFactories.registerFactory(new ContactCardEmbeddableFactory());
  const container = new DashboardContainer(getSampleDashboardInput(), embeddableFactories);
  const embeddable = await container.addNewEmbeddable<ContactCardEmbeddableInput>(
    CONTACT_CARD_EMBEDDABLE,
    {
      firstName: 'Kibana',
    }
  );
  expect(embeddable).toBeDefined();

  if (!isErrorEmbeddable(embeddable)) {
    expect(embeddable.getInput().firstName).toBe('Kibana');
  } else {
    expect(false).toBe(true);
  }

  const embeddableInContainer = container.getChild<ContactCardEmbeddable>(embeddable.id);
  expect(embeddableInContainer).toBeDefined();
  expect(embeddableInContainer.id).toBe(embeddable.id);
});

test('Container view mode change propagates to children', async () => {
  const embeddableFactories = new EmbeddableFactoryRegistry();
  embeddableFactories.registerFactory(new ContactCardEmbeddableFactory());
  const container = new DashboardContainer(getSampleDashboardInput(), embeddableFactories);
  const embeddable = await container.addNewEmbeddable<
    ContactCardEmbeddableInput,
    ContactCardEmbeddableOutput,
    ContactCardEmbeddable
  >(CONTACT_CARD_EMBEDDABLE, {
    firstName: 'Bob',
  });

  expect(embeddable.getInput().viewMode).toBe(ViewMode.VIEW);

  container.updateInput({ viewMode: ViewMode.EDIT });

  expect(embeddable.getInput().viewMode).toBe(ViewMode.EDIT);
});

test('DashboardContainer in edit mode shows edit mode actions', async () => {
  const editModeAction = new EditModeAction();
  actionRegistry.addAction(editModeAction);
  triggerRegistry.attachAction({
    triggerId: CONTEXT_MENU_TRIGGER,
    actionId: editModeAction.id,
  });

  const embeddableFactories = new EmbeddableFactoryRegistry();
  embeddableFactories.registerFactory(new ContactCardEmbeddableFactory());
  const container = new DashboardContainer(
    getSampleDashboardInput({ viewMode: ViewMode.VIEW }),
    embeddableFactories
  );

  const embeddable = await container.addNewEmbeddable<
    ContactCardEmbeddableInput,
    ContactCardEmbeddableOutput,
    ContactCardEmbeddable
  >(CONTACT_CARD_EMBEDDABLE, {
    firstName: 'Bob',
  });

  const component = mount(
    <I18nProvider>
      <EmbeddablePanel embeddable={embeddable} />
    </I18nProvider>
  );

  const button = findTestSubject(component, 'embeddablePanelToggleMenuIcon');

  expect(button.length).toBe(1);
  findTestSubject(component, 'embeddablePanelToggleMenuIcon').simulate('click');

  expect(findTestSubject(component, `embeddablePanelContextMenuOpen`).length).toBe(1);

  const editAction = findTestSubject(component, `embeddablePanelAction-${editModeAction.id}`);

  expect(editAction.length).toBe(0);

  container.updateInput({ viewMode: ViewMode.EDIT });
  await nextTick();
  component.update();
  findTestSubject(component, 'embeddablePanelToggleMenuIcon').simulate('click');
  await nextTick();
  component.update();
  expect(findTestSubject(component, 'embeddablePanelContextMenuOpen').length).toBe(0);
  findTestSubject(component, 'embeddablePanelToggleMenuIcon').simulate('click');
  await nextTick();
  component.update();
  expect(findTestSubject(component, 'embeddablePanelContextMenuOpen').length).toBe(1);

  await nextTick();
  component.update();

  const action = findTestSubject(component, `embeddablePanelAction-${editModeAction.id}`);
  expect(action.length).toBe(1);
});
