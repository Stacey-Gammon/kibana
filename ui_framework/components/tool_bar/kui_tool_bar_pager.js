import React from 'react';

import { KuiToolBarPagerText } from './kui_tool_bar_pager_text';
import { KuiToolBarPagerButtons } from './kui_tool_bar_pager_buttons';

export function KuiToolBarPager({ startNumber, endNumber, totalItems, hasPreviousPage, hasNextPage, onNextPage, onPreviousPage }) {
  return <div>
      <KuiToolBarPagerText
        start={startNumber}
        end={endNumber}
        count={totalItems} />
      <KuiToolBarPagerButtons
        hasNext={hasNextPage()}
        hasPrevious={hasPreviousPage()}
        onNext={onNextPage}
        onPrevious={onPreviousPage}
      />
    </div>;
}

KuiToolBarPager.propTypes = {
  startNumber: React.PropTypes.number,
  endNumber: React.PropTypes.number,
  totalItems: React.PropTypes.number,
  hasPreviousPage: React.PropTypes.func.isRequired,
  hasNextPage: React.PropTypes.func.isRequired,
  onNextPage: React.PropTypes.func.isRequired,
  onPreviousPage: React.PropTypes.func.isRequired
};


