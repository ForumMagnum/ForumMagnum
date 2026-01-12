import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import type { ReviewGroup } from './groupings';
import { getReviewGroupDisplayName } from './groupings';

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
}));

export type TabInfo = {
  group: ReviewGroup | 'all' | 'posts' | 'classifiedPosts';
  count: number;
};

const ModerationTabs = ({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: TabInfo[];
  activeTab: ReviewGroup | 'all' | 'posts' | 'classifiedPosts';
  onTabChange: (tab: ReviewGroup | 'all' | 'posts' | 'classifiedPosts') => void;
}) => {
  const classes = useStyles(styles);

  return (
    <div className={classes.root}>
      {tabs.map((tab, index) => (
        <div
          key={tab.group}
          className={classNames(classes.tab, {
            [classes.activeTab]: activeTab === tab.group,
            [classes.firstTab]: index === 0,
            [classes.lastTab]: index === tabs.length - 1,
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
