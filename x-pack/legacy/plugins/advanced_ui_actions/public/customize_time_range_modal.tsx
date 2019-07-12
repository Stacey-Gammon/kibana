/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { Component } from 'react';

import {
  EuiFormRow,
  EuiButton,
  EuiButtonEmpty,
  EuiModalHeader,
  EuiModalFooter,
  EuiModalBody,
  EuiModalHeaderTitle,
  EuiSuperDatePicker,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { TimeRange } from 'ui/timefilter/time_history';
import { i18n } from '@kbn/i18n';
import { Embeddable } from '../../../../../src/legacy/core_plugins/embeddable_api/public';
import { TimeRangeInput } from './custom_time_range_action';
import { doesInheritTimeRange } from './does_inherit_time_range';

interface CustomizeTimeRangeProps {
  embeddable: Embeddable<TimeRangeInput>;
  onClose: () => void;
  dateFormat?: string;
}

interface State {
  timeRange?: TimeRange;
  inheritTimeRange: boolean;
}

export class CustomizeTimeRangeModal extends Component<CustomizeTimeRangeProps, State> {
  constructor(props: CustomizeTimeRangeProps) {
    super(props);
    this.state = {
      timeRange: props.embeddable.getInput().timeRange,
      inheritTimeRange: doesInheritTimeRange(props.embeddable),
    };
  }

  onTimeChange = ({ start, end }: { start: string; end: string }) => {
    this.setState({ timeRange: { from: start, to: end } });
  };

  cancel = () => {
    this.props.onClose();
  };

  onInheritToggle = () => {
    this.setState(prevState => ({
      inheritTimeRange: !prevState.inheritTimeRange,
    }));
  };

  addToPanel = () => {
    const { embeddable } = this.props;

    embeddable.updateInput({ timeRange: this.state.timeRange });

    this.props.onClose();
  };

  inheritFromParent = () => {
    const { embeddable } = this.props;
    const parent = embeddable.parent;
    const parentPanels = parent!.getInput().panels;

    // Remove any explicit input to this child from the parent.
    parent!.updateInput({
      panels: {
        ...parentPanels,
        [embeddable.id]: {
          ...parentPanels[embeddable.id],
          explicitInput: {
            ...parentPanels[embeddable.id].explicitInput,
            timeRange: undefined,
          },
        },
      },
    });

    this.props.onClose();
  };

  public render() {
    return (
      <React.Fragment>
        <EuiModalHeader>
          <EuiModalHeaderTitle data-test-subj="customizePanelTitle">
            {i18n.translate('xpack.advancedUiActions.customizeTimeRange.modal.headerTitle', {
              defaultMessage: 'Customize panel time range',
            })}
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          {' '}
          <EuiFormRow
            label={i18n.translate(
              'xpack.advancedUiActions.customizePanelTimeRange.modal.optionsMenuForm.panelTitleFormRowLabel',
              {
                defaultMessage: 'Time range',
              }
            )}
          >
            <EuiSuperDatePicker
              start={this.state.timeRange ? this.state.timeRange.from : undefined}
              end={this.state.timeRange ? this.state.timeRange.to : undefined}
              isPaused={false}
              onTimeChange={this.onTimeChange}
              showUpdateButton={false}
              dateFormat={this.props.dateFormat}
            />
          </EuiFormRow>
        </EuiModalBody>
        <EuiModalFooter>
          <EuiFlexGroup justifyContent="spaceBetween">
            <EuiFlexItem>
              <EuiFlexGroup gutterSize="s">
                <EuiButtonEmpty
                  onClick={this.inheritFromParent}
                  color="danger"
                  data-test-subj="removePerPanelTimeRangeButton"
                  disabled={this.state.inheritTimeRange}
                >
                  {' '}
                  {i18n.translate(
                    'xpack.advancedUiActions.customizePanelTimeRange.modal.removeButtonTitle',
                    {
                      defaultMessage: 'Remove',
                    }
                  )}
                </EuiButtonEmpty>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFlexGroup gutterSize="s">
                <EuiButtonEmpty
                  onClick={this.cancel}
                  data-test-subj="cancelPerPanelTimeRangeButton"
                >
                  {' '}
                  {i18n.translate(
                    'xpack.advancedUiActions.customizePanelTimeRange.modal.cancelButtonTitle',
                    {
                      defaultMessage: 'Cancel',
                    }
                  )}
                </EuiButtonEmpty>

                <EuiButton
                  data-test-subj="addPerPanelTimeRangeButton"
                  onClick={this.addToPanel}
                  fill
                >
                  {i18n.translate(
                    'xpack.advancedUiActions.customizePanelTimeRange.modal.addToPanelButtonTitle',
                    {
                      defaultMessage: 'Add to panel',
                    }
                  )}
                </EuiButton>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiModalFooter>
      </React.Fragment>
    );
  }
}
