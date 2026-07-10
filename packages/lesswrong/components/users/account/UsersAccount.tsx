"use client";
import React, { useCallback, useState } from 'react';
import { userCanEditUser, userCanSeeAdminSettingsTab, userGetProfileUrl } from '@/lib/collections/users/helpers';
import { useCurrentUser } from '@/components/common/withUser';
import { hasAccountDeletionFlow } from '@/lib/betas';
import { useLocation, useNavigate } from '@/lib/routeUtil';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { Link } from '@/lib/reactRouterWrapper';
import UsersEditForm, { getSettingsTabForField } from './UsersEditForm';
import UsersAccountManagement from './UsersAccountManagement';
import ErrorAccessDenied from '../../common/ErrorAccessDenied';
import Error404 from '../../common/Error404';
import Loading from '../../vulcan-core/Loading';
import DashboardSidebar, { DASHBOARD_TAB_IDS, type DashboardTabId } from './DashboardSidebar';
import type { SettingsTabId } from './AccountSettingsSidebar';
import DashboardPostsTab from './DashboardPostsTab';
import DashboardCommentsTab from './DashboardCommentsTab';
import DashboardSequencesTab from './DashboardSequencesTab';
import DashboardWikiEditsTab from './DashboardWikiEditsTab';
import DashboardSubscriptionsTab from './DashboardSubscriptionsTab';
import DashboardGroupsTab from './DashboardGroupsTab';
import { hasEventsSetting } from '@/lib/instanceSettings';
import { defineStyles, useStyles } from '../../hooks/useStyles';
import classNames from 'classnames';

const TargetUserBySlugQuery = gql(`
  query UsersAccountTargetUser($slug: String!) {
    GetUserBySlug(slug: $slug) {
      ...UsersMinimumInfo
    }
  }
`);

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
  profileLink: {
    fontWeight: 500,
    color: theme.palette.primary.main,
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
  hiddenTab: {
    display: 'none',
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

interface DashboardTabVisibility {
  showAdminTab: boolean;
  showGroupsTab: boolean;
}

function isTabVisible(tab: DashboardTabId, {showAdminTab, showGroupsTab}: DashboardTabVisibility): boolean {
  if (tab === 'settings-admin') return showAdminTab;
  if (tab === 'groups') return showGroupsTab;
  return true;
}

function parseDashboardTab(
  query: Record<string, string>,
  defaultTab: DashboardTabId,
  visibility: DashboardTabVisibility,
): DashboardTabId {
  const raw = query?.tab;
  if (!raw) return defaultTab;

  // Handle legacy settings tab IDs (from old /account?tab=account links)
  const tab = LEGACY_TAB_MAP[raw] ?? raw;

  if (DASHBOARD_TAB_IDS.has(tab) && isTabVisible(tab, visibility)) return tab;

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
  const isOwnAccount = slug === null || slug === currentUser?.slug;
  const hasEditAccess = !!slugWithFallback && !!currentUser && userCanEditUser(currentUser, {slug: slugWithFallback});

  const { data: targetUserData, loading: loadingTargetUser } = useQuery(TargetUserBySlugQuery, {
    variables: { slug: slugWithFallback ?? '' },
    skip: isOwnAccount || !hasEditAccess,
  });

  // Once the user has visited a settings tab, keep the settings form mounted
  // (hidden) when they switch to a content tab, so unsaved edits aren't lost.
  const [settingsFormMounted, setSettingsFormMounted] = useState(false);
  const [lastSettingsTab, setLastSettingsTab] = useState<SettingsTabId>('account');

  if (!hasEditAccess || !currentUser) {
    return <ErrorAccessDenied />;
  }

  const defaultTab: DashboardTabId = isOwnAccount ? 'posts' : 'settings-account';

  const visibility: DashboardTabVisibility = {
    showAdminTab: userCanSeeAdminSettingsTab(currentUser),
    showGroupsTab: hasEventsSetting.get(),
  };

  // Handle highlightField: if present, navigate to the correct settings tab
  const highlightedField = query?.highlightField ?? null;
  const highlightSettingsTab = getSettingsTabForField(highlightedField);
  const highlightTab: DashboardTabId | null = highlightSettingsTab
    ? `settings-${highlightSettingsTab}` as DashboardTabId
    : null;
  const activeTab: DashboardTabId = highlightTab && isTabVisible(highlightTab, visibility)
    ? highlightTab
    : parseDashboardTab(query, defaultTab, visibility);

  const onSettingsTab = isSettingsTab(activeTab);
  if (onSettingsTab && !settingsFormMounted) {
    setSettingsFormMounted(true);
  }
  const activeSettingsTab = onSettingsTab ? getSettingsSubTab(activeTab) : lastSettingsTab;
  if (onSettingsTab && activeSettingsTab !== lastSettingsTab) {
    setLastSettingsTab(activeSettingsTab);
  }

  const targetUser = isOwnAccount ? currentUser : targetUserData?.GetUserBySlug;

  if (!isOwnAccount && loadingTargetUser) {
    return <Loading />;
  }
  if (!targetUser) {
    return <Error404 />;
  }

  const accountManagement = hasAccountDeletionFlow()
    ? <UsersAccountManagement terms={{slug: slugWithFallback}} />
    : null;

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <h1 className={classes.title}>
          {isOwnAccount ? 'Dashboard' : `${targetUser.displayName} — Account Settings`}
        </h1>
        <div className={classes.subtitle}>
          {isOwnAccount
            ? 'Manage your content, subscriptions, and account settings'
            : 'Manage account, profile, and preferences'
          }
          {' · '}
          <Link to={userGetProfileUrl(targetUser)} className={classes.profileLink}>
            View {isOwnAccount ? 'your ' : ''}public profile
          </Link>
        </div>
      </div>

      <div className={classes.layout}>
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showAdminTab={visibility.showAdminTab}
          showGroupsTab={visibility.showGroupsTab}
        />

        <div className={classes.contentArea}>
          {activeTab === 'posts' && (
            <DashboardPostsTab userId={targetUser._id} isOwnAccount={isOwnAccount} />
          )}
          {activeTab === 'comments' && (
            <DashboardCommentsTab userId={targetUser._id} />
          )}
          {activeTab === 'sequences' && (
            <DashboardSequencesTab userId={targetUser._id} isOwnAccount={isOwnAccount} />
          )}
          {activeTab === 'wikiEdits' && (
            <DashboardWikiEditsTab userId={targetUser._id} />
          )}
          {activeTab === 'subscriptions' && (
            <DashboardSubscriptionsTab userId={targetUser._id} isOwnAccount={isOwnAccount} />
          )}
          {activeTab === 'groups' && (
            <DashboardGroupsTab userId={targetUser._id} />
          )}
          {settingsFormMounted && (
            <div className={classNames(!onSettingsTab && classes.hiddenTab)}>
              <UsersEditForm
                terms={{slug: slugWithFallback}}
                accountManagement={accountManagement}
                activeSettingsTab={activeSettingsTab}
                hideSidebar
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersAccount;
