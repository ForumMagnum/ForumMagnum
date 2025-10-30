import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import type { ReviewGroup } from './groupings';
import { getReviewGroupDisplayName } from './groupings';

const styles = defineStyles('ModerationTabs', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    display: 'flex',
    borderBottom: theme.palette.border.normal,
    backgroundColor: theme.palette.background.paper,
    position: 'sticky',
    top: 0,
    zIndex: 2,
  },
  tab: {
    padding: '12px 20px',
    cursor: 'pointer',
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
}));

export type TabInfo = {
  group: ReviewGroup | 'all' | 'posts';
  count: number;
};

const ModerationTabs = ({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: TabInfo[];
  activeTab: ReviewGroup | 'all' | 'posts';
  onTabChange: (tab: ReviewGroup | 'all' | 'posts') => void;
}) => {
  const classes = useStyles(styles);

  return (
    <div className={classes.root}>
      {tabs.map((tab) => (
        <div
          key={tab.group}
          className={classNames(classes.tab, {
            [classes.activeTab]: activeTab === tab.group,
          })}
          onClick={() => onTabChange(tab.group)}
        >
          {getReviewGroupDisplayName(tab.group)}
          <span className={classNames(classes.count, {
            [classes.activeCount]: activeTab === tab.group,
          })}>
            ({tab.count})
          </span>
        </div>
      ))}
    </div>
  );
};

export default ModerationTabs;

