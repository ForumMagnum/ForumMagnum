import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export const SETTINGS_TABS = [
  { id: 'account', label: 'Account' },
  { id: 'profile', label: 'Profile' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'moderation', label: 'Moderation' },
  { id: 'admin', label: 'Admin' },
] as const;

export type SettingsTabId = (typeof SETTINGS_TABS)[number]['id'];

const styles = defineStyles('AccountSettingsSidebar', (theme: ThemeType) => ({
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

const AccountSettingsSidebar = ({ activeTab, onTabChange, showAdminTab }: {
  activeTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
  showAdminTab: boolean;
}) => {
  const classes = useStyles(styles);
  const visibleTabs = showAdminTab
    ? SETTINGS_TABS
    : SETTINGS_TABS.filter(t => t.id !== 'admin');

  return (
    <nav className={classes.root}>
      <div className={classes.tabList}>
        {visibleTabs.map(tab => (
          <div
            key={tab.id}
            className={classNames(classes.tab, activeTab === tab.id && classes.activeTab)}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>
    </nav>
  );
};

export default AccountSettingsSidebar;
