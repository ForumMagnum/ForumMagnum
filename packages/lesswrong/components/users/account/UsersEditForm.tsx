import { useMessages } from '@/components/common/withMessages';
import React, { useCallback } from 'react';
import { EditableUser, getUserEmail, userCanEditUser, userCanSeeAdminSettingsTab } from '@/lib/collections/users/helpers';
import { useCurrentUser } from '@/components/common/withUser';
import { useMutation } from '@apollo/client/react';
import { useQuery } from "@/lib/crud/useQuery"
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import Loading from "../../vulcan-core/Loading";
import ErrorAccessDenied from "../../common/ErrorAccessDenied";
import { gql } from "@/lib/generated/gql-codegen";
import { toEditableUser, useAutoSavedUserSettings } from './useAutoSavedUserSettings';
import type { SettingsTabId } from './settingsTabTypes';
import AccountSettingsTab from './AccountSettingsTab';
import ProfileSettingsTab from './ProfileSettingsTab';
import PreferencesSettingsTab from './PreferencesSettingsTab';
import NotificationsSettingsTab from './NotificationsSettingsTab';
import ModerationSettingsTab from './ModerationSettingsTab';
import AdminSettingsTab from './AdminSettingsTab';

const GetUserBySlugQuery = gql(`
  query UsersEditFormGetUserBySlug($slug: String!) {
    GetUserBySlug(slug: $slug) {
      ...UsersEdit
    }
  }
`);

const FIELD_TO_TAB: Record<string, SettingsTabId> = {
  displayName: 'account',
  email: 'account',
  deleted: 'account',
  pinnedPostIds: 'profile',
  hideProfileTopPosts: 'profile',
  biography: 'profile',
  fullName: 'profile',
  commentSorting: 'preferences',
  sortDraftsBy: 'preferences',
  hideFrontpageMap: 'preferences',
  hideFrontpageBook2020Ad: 'preferences',
  noKibitz: 'preferences',
  showHideKarmaOption: 'preferences',
  beta: 'preferences',
  hideIntercom: 'preferences',
  markDownPostEditor: 'preferences',
  hideElicitPredictions: 'preferences',
  hideAFNonMemberInitialWarning: 'preferences',
  noSingleLineComments: 'preferences',
  noCollapseCommentsPosts: 'preferences',
  noCollapseCommentsFrontpage: 'preferences',
  hideCommunitySection: 'preferences',
  showCommunityInRecentDiscussion: 'preferences',
  postGlossariesPinned: 'preferences',
  googleLocation: 'preferences',
  mapLocation: 'preferences',
  hideFromPeopleDirectory: 'preferences',
  allowDatadogSessionReplay: 'preferences',
  auto_subscribe_to_my_posts: 'notifications',
  auto_subscribe_to_my_comments: 'notifications',
  autoSubscribeAsOrganizer: 'notifications',
  notificationCommentsOnSubscribedPost: 'notifications',
  notificationShortformContent: 'notifications',
  notificationRepliesToMyComments: 'notifications',
  notificationRepliesToSubscribedComments: 'notifications',
  notificationSubscribedUserPost: 'notifications',
  notificationSubscribedUserComment: 'notifications',
  notificationPostsInGroups: 'notifications',
  notificationSubscribedTagPost: 'notifications',
  notificationSubscribedSequencePost: 'notifications',
  notificationPrivateMessage: 'notifications',
  notificationSharedWithMe: 'notifications',
  notificationAlignmentSubmissionApproved: 'notifications',
  notificationEventInRadius: 'notifications',
  notificationRSVPs: 'notifications',
  notificationGroupAdministration: 'notifications',
  notificationCommentsOnDraft: 'notifications',
  notificationSubforumUnread: 'notifications',
  notificationNewMention: 'notifications',
  notificationTypoSuggestions: 'notifications',
  notificationDialogueMessages: 'notifications',
  notificationPublishedDialogueMessages: 'notifications',
  notificationAddedAsCoauthor: 'notifications',
  karmaChangeNotifierSettings: 'notifications',
  whenConfirmationEmailSent: 'notifications',
  emailSubscribedToCurated: 'notifications',
  unsubscribeFromAll: 'notifications',
  moderationGuidelines: 'moderation',
  moderationStyle: 'moderation',
  moderatorAssistance: 'moderation',
  collapseModerationGuidelines: 'moderation',
  bannedUserIds: 'moderation',
  bannedPersonalUserIds: 'moderation',
  previousDisplayName: 'admin',
  slug: 'admin',
  twitterProfileURLAdmin: 'admin',
  noindex: 'admin',
  sunshineFlagged: 'admin',
  needsReview: 'admin',
  sunshineSnoozed: 'admin',
  snoozedUntilContentCount: 'admin',
  reviewedByUserId: 'admin',
  reviewedAt: 'admin',
  shortformFeedId: 'admin',
  viewUnreviewedComments: 'admin',
  defaultToCKEditor: 'admin',
  signUpReCaptchaRating: 'admin',
  abTestKey: 'admin',
  hideSunshineSidebar: 'admin',
  postingDisabled: 'admin',
  allCommentingDisabled: 'admin',
  commentingOnOtherUsersDisabled: 'admin',
  conversationsDisabled: 'admin',
  nullifyVotes: 'admin',
  deleteContent: 'admin',
  banned: 'admin',
  paymentEmail: 'admin',
  paymentInfo: 'admin',
  isAdmin: 'admin',
  groups: 'admin',
};

export function getSettingsTabForField(fieldName: string | null | undefined): SettingsTabId | null {
  if (!fieldName) return null;
  return FIELD_TO_TAB[fieldName] ?? null;
}

const styles = defineStyles('UsersEditForm', (theme: ThemeType) => ({
  root: {
  },
  fieldWrapper: {
    marginTop: 14,
    marginBottom: 14,
  },
  tabPanel: {
    display: 'none',
  },
  tabPanelActive: {
    display: 'block',
  },
  saveStatus: {
    position: 'fixed',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '6px 14px',
    borderRadius: 16,
    fontSize: 13,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[700],
    background: theme.palette.panelBackground.default,
    border: `1px solid ${theme.palette.greyAlpha(0.15)}`,
    boxShadow: theme.palette.boxShadow.eaCard,
    pointerEvents: 'none',
    opacity: 0,
    transition: 'opacity 0.2s ease',
    zIndex: theme.zIndexes.intercomButton,
  },
  saveStatusVisible: {
    opacity: 1,
  },
}));

const UsersSettingsForm = ({
  initialData,
  currentUser,
  isCurrentUser,
  requestPasswordReset,
  accountManagement,
  activeTab,
  refetchUser,
}: {
  initialData: EditableUser;
  currentUser: UsersCurrent;
  isCurrentUser: boolean;
  requestPasswordReset: () => void;
  accountManagement: React.ReactNode | null;
  activeTab: SettingsTabId;
  refetchUser: () => Promise<UsersEdit | null | undefined>;
}) => {
  const classes = useStyles(styles);
  const { settings, updateSettings, bind, saveStatus } = useAutoSavedUserSettings(initialData, refetchUser);

  const showAdminTab = userCanSeeAdminSettingsTab(currentUser);

  const tabProps = {
    settings,
    updateSettings,
    bind,
    currentUser,
    isCurrentUser,
    fieldWrapperClass: classes.fieldWrapper,
  };

  return (
    <div>
      <div className={classNames(classes.saveStatus, saveStatus !== 'idle' && classes.saveStatusVisible)}>
        {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
      </div>

      <div className={classNames(classes.tabPanel, activeTab === 'account' && classes.tabPanelActive)}>
        <AccountSettingsTab
          {...tabProps}
          requestPasswordReset={requestPasswordReset}
          accountManagement={accountManagement}
        />
      </div>

      <div className={classNames(classes.tabPanel, activeTab === 'profile' && classes.tabPanelActive)}>
        <ProfileSettingsTab {...tabProps} />
      </div>

      <div className={classNames(classes.tabPanel, activeTab === 'preferences' && classes.tabPanelActive)}>
        <PreferencesSettingsTab {...tabProps} />
      </div>

      <div className={classNames(classes.tabPanel, activeTab === 'notifications' && classes.tabPanelActive)}>
        <NotificationsSettingsTab {...tabProps} />
      </div>

      <div className={classNames(classes.tabPanel, activeTab === 'moderation' && classes.tabPanelActive)}>
        <ModerationSettingsTab {...tabProps} />
      </div>

      {showAdminTab && (
        <div className={classNames(classes.tabPanel, activeTab === 'admin' && classes.tabPanelActive)}>
          <AdminSettingsTab {...tabProps} />
        </div>
      )}
    </div>
  );
};

const UsersEditForm = ({ terms, accountManagement, activeSettingsTab }: {
  terms: { slug: string },
  accountManagement?: React.ReactNode | null,
  activeSettingsTab: SettingsTabId,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const [mutate] = useMutation(gql(`
    mutation resetPassword($email: String) {
      resetPassword(email: $email)
    }
  `), { errorPolicy: 'all' })
  const userHasEditAccess = userCanEditUser(currentUser, terms);

  const { data: userBySlugData, loading: loadingUser, refetch } = useQuery(GetUserBySlugQuery, {
    variables: { slug: terms.slug },
    skip: !userHasEditAccess,
  });

  const userBySlug = userBySlugData?.GetUserBySlug;

  const refetchUser = useCallback(async () => {
    const { data } = await refetch();
    return data?.GetUserBySlug;
  }, [refetch]);

  if (!userHasEditAccess || !currentUser) {
    return <ErrorAccessDenied />;
  }
  const isCurrentUser = (terms.slug === currentUser?.slug)

  const requestPasswordReset = async () => {
    const { data } = await mutate({ variables: { email: getUserEmail(currentUser) } })
    if (!data?.resetPassword) {
      flash({ messageString: "Password reset may have failed.  Try it and see; ping us on Intercom if you can't get it working." });
      return;
    }
    flash(data?.resetPassword)
  }

  return (
    <div className={classes.root}>
      {loadingUser && <Loading />}
      {!loadingUser && userBySlug && (
        <UsersSettingsForm
          // Keyed so that navigating between different users' settings pages
          // fully resets local settings state, drafts, and the save queue
          key={userBySlug._id}
          initialData={toEditableUser(userBySlug)}
          currentUser={currentUser}
          isCurrentUser={isCurrentUser}
          requestPasswordReset={requestPasswordReset}
          accountManagement={accountManagement ?? null}
          activeTab={activeSettingsTab}
          refetchUser={refetchUser}
        />
      )}
    </div>
  );
};

export default UsersEditForm;
