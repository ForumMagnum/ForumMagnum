"use client";
import React, { useCallback } from 'react';
import { userCanEditUser } from '@/lib/collections/users/helpers';
import { useCurrentUser } from '@/components/common/withUser';
import { hasAccountDeletionFlow } from '@/lib/betas';
import { useLocation, useNavigate } from '@/lib/routeUtil';
import { userIsAdmin, userIsMemberOf } from '@/lib/vulcan-users/permissions';
import UsersEditForm, { getSettingsTabForField } from './UsersEditForm';
import UsersAccountManagement from './UsersAccountManagement';
import ErrorAccessDenied from '../../common/ErrorAccessDenied';
import DashboardSidebar, { type DashboardTabId } from './DashboardSidebar';
import type { SettingsTabId } from './AccountSettingsSidebar';
import DashboardPostsTab from './DashboardPostsTab';
import DashboardCommentsTab from './DashboardCommentsTab';
import DashboardSequencesTab from './DashboardSequencesTab';
import DashboardWikiEditsTab from './DashboardWikiEditsTab';
import DashboardSubscriptionsTab from './DashboardSubscriptionsTab';
import DashboardGroupsTab from './DashboardGroupsTab';
import { hasEventsSetting } from '@/lib/instanceSettings';
import { defineStyles, useStyles } from '../../hooks/useStyles';

const styles = defineStyles('UsersAccount', (theme: ThemeType) => ({
  root: {
    width: '90%',
    maxWidth: 960,
    margin: 'auto',
    marginBottom: 100,
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      paddingLeft: 16,
      paddingRight: 16,
    },
  },
  header: {
    paddingTop: 48,
    paddingBottom: 32,
    [theme.breakpoints.down('xs')]: {
      paddingTop: 28,
      paddingBottom: 20,
    },
  },
  title: {
    fontSize: 28,
    fontWeight: 400,
    fontFamily: theme.typography.headerStyle?.fontFamily,
    color: theme.palette.grey[900],
    margin: 0,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[500],
    marginTop: 6,
  },
  layout: {
    display: 'flex',
    gap: 40,
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      gap: 16,
    },
  },
  contentArea: {
    flexGrow: 1,
    minWidth: 0,
    paddingBottom: 24,
  },
}));

const SETTINGS_TAB_PREFIX = 'settings-';

/** Legacy tab IDs from the old /account page that map to new dashboard tab IDs */
const LEGACY_TAB_MAP: Record<string, DashboardTabId> = {
  account: 'settings-account',
  profile: 'settings-profile',
  preferences: 'settings-preferences',
  notifications: 'settings-notifications',
  moderation: 'settings-moderation',
  admin: 'settings-admin',
};

const ALL_DASHBOARD_TAB_IDS = new Set<string>([
  'posts', 'comments', 'sequences', 'wikiEdits',
  'subscriptions', 'groups',
  'settings-account', 'settings-profile', 'settings-preferences',
  'settings-notifications', 'settings-moderation', 'settings-admin',
]);

function parseDashboardTab(query: Record<string, string>, defaultTab: DashboardTabId): DashboardTabId {
  const raw = query?.tab;
  if (!raw) return defaultTab;

  // Handle legacy settings tab IDs (from old /account?tab=account links)
  if (raw in LEGACY_TAB_MAP) return LEGACY_TAB_MAP[raw];

  if (ALL_DASHBOARD_TAB_IDS.has(raw)) return raw as DashboardTabId;

  return defaultTab;
}

function isSettingsTab(tab: DashboardTabId): boolean {
  return tab.startsWith(SETTINGS_TAB_PREFIX);
}

function getSettingsSubTab(tab: DashboardTabId): SettingsTabId {
  return tab.slice(SETTINGS_TAB_PREFIX.length) as SettingsTabId;
}

const UsersAccount = ({slug}: {slug: string | null}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { query } = useLocation();
  const navigate = useNavigate();

  const setActiveTab = useCallback((tab: DashboardTabId) => {
    navigate({
      search: `?tab=${tab}`,
    }, { replace: true });
  }, [navigate]);

  const slugWithFallback = slug ?? currentUser?.slug;

  if (!slugWithFallback || !currentUser || !userCanEditUser(currentUser, {slug: slugWithFallback})) {
    return <ErrorAccessDenied />;
  }

  const isOwnAccount = slug === null || slug === currentUser.slug;
  const defaultTab: DashboardTabId = isOwnAccount ? 'posts' : 'settings-account';

  // Handle highlightField: if present, navigate to the correct settings tab
  const highlightedField = query?.highlightField ?? null;
  const highlightSettingsTab = getSettingsTabForField(highlightedField);
  const activeTab: DashboardTabId = highlightSettingsTab
    ? `settings-${highlightSettingsTab}` as DashboardTabId
    : parseDashboardTab(query, defaultTab);

  const showAdminTab = userIsAdmin(currentUser) || userIsMemberOf(currentUser, 'realAdmins') || userIsMemberOf(currentUser, 'alignmentForumAdmins');
  const showGroupsTab = hasEventsSetting.get();

  const accountManagement = hasAccountDeletionFlow()
    ? <UsersAccountManagement terms={{slug: slugWithFallback}} />
    : null;

  const userId = isOwnAccount ? currentUser._id : slugWithFallback;

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <h1 className={classes.title}>
          {isOwnAccount ? 'Dashboard' : 'Account Settings'}
        </h1>
        <div className={classes.subtitle}>
          {isOwnAccount
            ? 'Manage your content, subscriptions, and account settings'
            : `Manage account, profile, and preferences`
          }
        </div>
      </div>

      <div className={classes.layout}>
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showAdminTab={showAdminTab}
          showGroupsTab={showGroupsTab}
        />

        <div className={classes.contentArea}>
          {activeTab === 'posts' && (
            <DashboardPostsTab userId={userId} />
          )}
          {activeTab === 'comments' && (
            <DashboardCommentsTab userId={userId} />
          )}
          {activeTab === 'sequences' && (
            <DashboardSequencesTab userId={userId} />
          )}
          {activeTab === 'wikiEdits' && (
            <DashboardWikiEditsTab userId={userId} />
          )}
          {activeTab === 'subscriptions' && (
            <DashboardSubscriptionsTab />
          )}
          {activeTab === 'groups' && (
            <DashboardGroupsTab userId={userId} />
          )}
          {isSettingsTab(activeTab) && (
            <UsersEditForm
              terms={{slug: slugWithFallback}}
              accountManagement={accountManagement}
              activeSettingsTab={getSettingsSubTab(activeTab)}
              hideSidebar
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersAccount;
