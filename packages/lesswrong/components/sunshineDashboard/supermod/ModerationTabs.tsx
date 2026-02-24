import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import type { TabId } from './groupings';
import { getReviewGroupDisplayName } from './groupings';
import FormatDate from '@/components/common/FormatDate';
import { useCurrentTime } from '@/lib/utils/timeUtil';

const styles = defineStyles('ModerationTabs', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    display: 'flex',
    overflowX: 'auto',
    overflowY: 'hidden',
    borderBottom: theme.palette.border.normal,
    backgroundColor: theme.palette.background.paper,
    position: 'sticky',
    top: 0,
    zIndex: 2,
  },
  tab: {
    padding: '12px 8px',
    cursor: 'pointer',
    flexShrink: 0,
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[700],
    borderBottom: '2px solid transparent',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
      color: theme.palette.grey[900],
    },
  },
  firstTab: {
    paddingLeft: '16px',
  },
  lastTab: {
    paddingRight: '16px',
  },
  activeTab: {
    color: theme.palette.primary.main,
    borderBottomColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: 'transparent',
      color: theme.palette.primary.main,
    },
  },
  count: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: 400,
    color: theme.palette.grey[600],
  },
  activeCount: {
    color: theme.palette.primary.main,
  },
  alertCount: {
    color: theme.palette.error.main,
  },
  separator: {
    width: 1,
    alignSelf: 'stretch',
    margin: '6px 4px',
    backgroundColor: theme.palette.greyAlpha(0.2),
    flexShrink: 0,
  },
}));

export type TabInfo = {
  group: TabId;
  count: number;
};

const ModerationTabs = ({
  tabs,
  activeTab,
  onTabChange,
  lastCuratedDate,
}: {
  tabs: TabInfo[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  lastCuratedDate?: string | null;
}) => {
  const classes = useStyles(styles);
  const now = useCurrentTime();

  const separatorAfter = new Set(['curation', 'all']);
  const daysSinceLastCuration = lastCuratedDate ? (now.getTime() - new Date(lastCuratedDate).getTime()) / (1000 * 60 * 60 * 24) : null;

  return (
    <div className={classes.root}>
      {tabs.map((tab, index) => (
        <React.Fragment key={tab.group}>
          <div
            className={classNames(classes.tab, {
              [classes.activeTab]: activeTab === tab.group,
              [classes.firstTab]: index === 0,
              [classes.lastTab]: index === tabs.length - 1,
            })}
            onClick={() => onTabChange(tab.group)}
          >
            {getReviewGroupDisplayName(tab.group)}
            {tab.group === 'curation' ? (
              lastCuratedDate != null && <span className={classNames(classes.count, {
                [classes.activeCount]: activeTab === tab.group,
                [classes.alertCount]: daysSinceLastCuration != null && daysSinceLastCuration > 2.5,
              })}>
                (<FormatDate date={lastCuratedDate} />)
              </span>
            ) : (
              <span className={classNames(classes.count, {
                [classes.activeCount]: activeTab === tab.group,
              })}>
                ({tab.count})
              </span>
            )}
          </div>
          {separatorAfter.has(tab.group) && <div className={classes.separator} />}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ModerationTabs;
