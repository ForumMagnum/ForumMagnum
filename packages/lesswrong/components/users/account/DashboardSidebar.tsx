import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

/**
 * All possible dashboard tab IDs. Grouped into sections:
 * - Content: posts, comments, sequences, wikiEdits
 * - Subscriptions: subscriptions
 * - Groups: groups
 * - Settings: settings-account, settings-profile, settings-preferences,
 *   settings-notifications, settings-moderation, settings-admin
 */
export type DashboardTabId =
  | 'posts'
  | 'comments'
  | 'sequences'
  | 'wikiEdits'
  | 'subscriptions'
  | 'groups'
  | 'settings-account'
  | 'settings-profile'
  | 'settings-preferences'
  | 'settings-notifications'
  | 'settings-moderation'
  | 'settings-admin';

interface DashboardTab {
  id: DashboardTabId;
  label: string;
}

interface DashboardTabGroup {
  label: string;
  tabs: DashboardTab[];
}

type DashboardSidebarEntry = DashboardTab | DashboardTabGroup;

function isGroup(entry: DashboardSidebarEntry): entry is DashboardTabGroup {
  return 'tabs' in entry;
}

function getSidebarEntries({showAdminTab, showGroupsTab}: {
  showAdminTab: boolean;
  showGroupsTab: boolean;
}): DashboardSidebarEntry[] {
  const settingsTabs: DashboardTab[] = [
    { id: 'settings-account', label: 'Account' },
    { id: 'settings-profile', label: 'Profile' },
    { id: 'settings-preferences', label: 'Preferences' },
    { id: 'settings-notifications', label: 'Notifications' },
    { id: 'settings-moderation', label: 'Moderation' },
    ...(showAdminTab ? [{ id: 'settings-admin' as const, label: 'Admin' }] : []),
  ];

  return [
    {
      label: 'Content',
      tabs: [
        { id: 'posts', label: 'Posts' },
        { id: 'comments', label: 'Comments' },
        { id: 'sequences', label: 'Sequences' },
        { id: 'wikiEdits', label: 'Wiki Edits' },
      ],
    },
    { id: 'subscriptions', label: 'Subscriptions' },
    ...(showGroupsTab ? [{ id: 'groups' as const, label: 'Groups' }] : []),
    {
      label: 'Settings',
      tabs: settingsTabs,
    },
  ];
}

const styles = defineStyles('DashboardSidebar', (theme: ThemeType) => ({
  root: {
    width: 180,
    flexShrink: 0,
    position: 'sticky' as const,
    top: 80,
    alignSelf: 'flex-start',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      position: 'static' as const,
      borderBottom: `1px solid ${theme.palette.greyAlpha(0.08)}`,
      marginBottom: 8,
    },
  },
  tabList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'row',
      overflowX: 'auto',
      gap: 0,
      paddingBottom: 0,
    },
  },
  groupHeader: {
    padding: '16px 12px 4px',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[500],
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    userSelect: 'none',
    '&:first-child': {
      paddingTop: 0,
    },
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  tab: {
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: 14,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[600],
    borderRadius: 6,
    transition: 'color 0.12s ease, background 0.12s ease',
    userSelect: 'none',
    '&:hover': {
      color: theme.palette.grey[900],
      background: theme.palette.greyAlpha(0.05),
    },
    [theme.breakpoints.down('xs')]: {
      borderRadius: 0,
      whiteSpace: 'nowrap',
      padding: '10px 16px',
      borderBottom: '2px solid transparent',
    },
  },
  nestedTab: {
    paddingLeft: 24,
    [theme.breakpoints.down('xs')]: {
      paddingLeft: 16,
    },
  },
  activeTab: {
    color: theme.palette.grey[1000],
    fontWeight: 600,
    background: theme.palette.greyAlpha(0.06),
    [theme.breakpoints.down('xs')]: {
      background: 'none',
      borderBottomColor: theme.palette.primary.main,
    },
  },
}));

const DashboardSidebar = ({activeTab, onTabChange, showAdminTab, showGroupsTab}: {
  activeTab: DashboardTabId;
  onTabChange: (tab: DashboardTabId) => void;
  showAdminTab: boolean;
  showGroupsTab: boolean;
}) => {
  const classes = useStyles(styles);
  const entries = getSidebarEntries({ showAdminTab, showGroupsTab });

  return (
    <nav className={classes.root}>
      <div className={classes.tabList}>
        {entries.map((entry) => {
          if (isGroup(entry)) {
            return <React.Fragment key={entry.label}>
              <div className={classes.groupHeader}>{entry.label}</div>
              {entry.tabs.map(tab => (
                <div
                  key={tab.id}
                  className={classNames(classes.tab, classes.nestedTab, activeTab === tab.id && classes.activeTab)}
                  onClick={() => onTabChange(tab.id)}
                >
                  {tab.label}
                </div>
              ))}
            </React.Fragment>;
          }
          return (
            <div
              key={entry.id}
              className={classNames(classes.tab, activeTab === entry.id && classes.activeTab)}
              onClick={() => onTabChange(entry.id)}
            >
              {entry.label}
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default DashboardSidebar;
