import { useMessages } from '@/components/common/withMessages';
import React, { useCallback } from 'react';
import { EditableUser, getUserEmail, userCanEditUser, userGetDisplayName, userGetProfileUrl } from '@/lib/collections/users/helpers';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useCurrentUser } from '@/components/common/withUser';
import { useMutation, useApolloClient } from '@apollo/client/react';
import { useQuery } from "@/lib/crud/useQuery"
import { useLocation, useNavigate } from '@/lib/routeUtil.tsx';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { submitButtonStyles } from '@/components/tanstack-form-components/TanStackSubmit';
import { getUpdatedFieldValues } from '@/components/tanstack-form-components/helpers';
import { useEditorFormCallbacks } from '@/components/editor/EditorFormComponent';
import { useForm } from '@tanstack/react-form';
import classNames from 'classnames';
import { userIsAdmin, userIsMemberOf } from '@/lib/vulcan-users/permissions';
import Loading from "../../vulcan-core/Loading";
import Error404 from "../../common/Error404";
import ErrorAccessDenied from "../../common/ErrorAccessDenied";
import { withDateFields } from '@/lib/utils/dateUtils';
import { gql } from "@/lib/generated/gql-codegen";
import { useFormErrors } from '@/components/tanstack-form-components/BaseAppForm';
import AccountSettingsSidebar, { type SettingsTabId } from './AccountSettingsSidebar';
import AccountSettingsTab from './AccountSettingsTab';
import ProfileSettingsTab from './ProfileSettingsTab';
import PreferencesSettingsTab from './PreferencesSettingsTab';
import NotificationsSettingsTab from './NotificationsSettingsTab';
import ModerationSettingsTab from './ModerationSettingsTab';
import AdminSettingsTab from './AdminSettingsTab';
import type { SettingsFormApi } from './settingsTabTypes';

const UsersEditUpdateMutation = gql(`
  mutation updateUserUsersEditForm($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...UsersEdit
      }
    }
  }
`);

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

function getTabForField(fieldName: string | null | undefined): SettingsTabId | null {
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
  submitButton: {
    fontFamily: theme.typography.fontFamily,
    border: `1px solid ${theme.palette.primary.main}`,
    color: theme.palette.primary.main,
    padding: '8px 24px',
    fontSize: 14,
    fontWeight: 500,
    lineHeight: '1.4',
    borderRadius: 6,
    textTransform: 'none',
    background: 'none',
    '&:hover': {
      background: theme.palette.primary.main,
      color: theme.palette.text.alwaysWhite,
    },
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
  tabPanel: {
    display: 'none',
  },
  tabPanelActive: {
    display: 'block',
  },
  submitArea: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 28,
    marginTop: 32,
  },
}));

const UsersForm = ({
  initialData,
  currentUser,
  onSuccess,
  isCurrentUser,
  requestPasswordReset,
  accountManagement,
}: {
  initialData: EditableUser;
  currentUser: UsersCurrent;
  onSuccess: (doc: UsersEdit) => void;
  isCurrentUser: boolean;
  requestPasswordReset: () => void;
  accountManagement: React.ReactNode | null;
}) => {
  const classes = useStyles(styles);
  const { query } = useLocation();
  const navigate = useNavigate();

  const highlightedField = query?.highlightField ?? null;
  const highlightTab = getTabForField(highlightedField);

  const rawTab = query?.tab as SettingsTabId | undefined;
  const activeTab: SettingsTabId = highlightTab ?? rawTab ?? 'account';

  const setActiveTab = useCallback((tab: SettingsTabId) => {
    navigate({
      search: `?tab=${tab}`,
    }, { replace: true });
  }, [navigate]);

  const {
    addOnSubmitCallback: addOnSubmitBiographyCallback,
    addOnSuccessCallback: addOnSuccessBiographyCallback,
    onSubmitCallback: onSubmitBiographyCallback,
    onSuccessCallback: onSuccessBiographyCallback,
  } = useEditorFormCallbacks<UsersEdit>();

  const {
    addOnSubmitCallback: addOnSubmitModerationGuidelinesCallback,
    addOnSuccessCallback: addOnSuccessModerationGuidelinesCallback,
    onSubmitCallback: onSubmitModerationGuidelinesCallback,
    onSuccessCallback: onSuccessModerationGuidelinesCallback,
  } = useEditorFormCallbacks<UsersEdit>();

  const [mutate] = useMutation(UsersEditUpdateMutation);

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...withDateFields(initialData, ['createdAt']),

      sunshineFlagged: initialData?.sunshineFlagged ?? false,
      needsReview: initialData?.needsReview ?? false,
      sunshineSnoozed: initialData?.sunshineSnoozed ?? false,

      reviewedAt: initialData?.reviewedAt ?? null,
      defaultToCKEditor: initialData?.defaultToCKEditor ?? null,
    },
    onSubmit: async ({ formApi }) => {
      await Promise.all([
        onSubmitBiographyCallback.current?.(),
        onSubmitModerationGuidelinesCallback.current?.(),
      ]);

      try {
        let result: UsersEdit;

        const updatedFields = getUpdatedFieldValues(formApi, ['biography', 'moderationGuidelines']);
        const { data } = await mutate({
          variables: {
            selector: { _id: initialData?._id },
            data: updatedFields
          }
        });
        if (!data?.updateUser?.data) {
          throw new Error('Failed to update user');
        }
        result = data.updateUser.data;

        onSuccessBiographyCallback.current?.(result);
        onSuccessModerationGuidelinesCallback.current?.(result);

        onSuccess(result);
      } catch (error) {
        setCaughtError(error);
      }
    },
  });

  if (!initialData) {
    return <Error404 />;
  }

  const showAdminTab = userIsAdmin(currentUser) || userIsMemberOf(currentUser, 'realAdmins') || userIsMemberOf(currentUser, 'alignmentForumAdmins');

  // The form's inferred type from useForm includes withDateFields transformations and
  // default value overrides that make it incompatible with SettingsFormApi due to deep
  // contravariance in TanStack Form's FormListeners type. The cast is safe because tab
  // components only use form.Field and form.state.values, not the listeners type.
  const settingsForm = form as unknown as SettingsFormApi;

  const tabProps = {
    form: settingsForm,
    currentUser,
    fieldWrapperClass: classes.fieldWrapper,
  };

  return (
    <form className="vulcan-form" onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      void form.handleSubmit();
    }}>
      {displayedErrorComponent}

      <div className={classes.layout}>
        <AccountSettingsSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showAdminTab={showAdminTab}
        />

        <div className={classes.contentArea}>
          <div className={classNames(classes.tabPanel, activeTab === 'account' && classes.tabPanelActive)}>
            <AccountSettingsTab
              {...tabProps}
              isCurrentUser={isCurrentUser}
              requestPasswordReset={requestPasswordReset}
              accountManagement={accountManagement}
            />
          </div>

          <div className={classNames(classes.tabPanel, activeTab === 'profile' && classes.tabPanelActive)}>
            <ProfileSettingsTab
              {...tabProps}
              addOnSubmitBiographyCallback={addOnSubmitBiographyCallback}
              addOnSuccessBiographyCallback={addOnSuccessBiographyCallback}
            />
          </div>

          <div className={classNames(classes.tabPanel, activeTab === 'preferences' && classes.tabPanelActive)}>
            <PreferencesSettingsTab {...tabProps} />
          </div>

          <div className={classNames(classes.tabPanel, activeTab === 'notifications' && classes.tabPanelActive)}>
            <NotificationsSettingsTab {...tabProps} />
          </div>

          <div className={classNames(classes.tabPanel, activeTab === 'moderation' && classes.tabPanelActive)}>
            <ModerationSettingsTab
              {...tabProps}
              addOnSubmitModerationGuidelinesCallback={addOnSubmitModerationGuidelinesCallback}
              addOnSuccessModerationGuidelinesCallback={addOnSuccessModerationGuidelinesCallback}
            />
          </div>

          {showAdminTab && (
            <div className={classNames(classes.tabPanel, activeTab === 'admin' && classes.tabPanelActive)}>
              <AdminSettingsTab {...tabProps} />
            </div>
          )}

          <div className={classNames("form-submit", classes.submitArea)}>
            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className={classNames("primary-form-submit-button", classes.submitButton)}
                >
                  Save Changes
                </Button>
              )}
            </form.Subscribe>
          </div>
          {displayedErrorComponent}
        </div>
      </div>
    </form>
  );
};

const UsersEditForm = ({ terms, accountManagement }: {
  terms: { slug: string },
  accountManagement?: React.ReactNode | null,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const navigate = useNavigate();
  const client = useApolloClient();
  const [mutate] = useMutation(gql(`
    mutation resetPassword($email: String) {
      resetPassword(email: $email)
    }
  `), { errorPolicy: 'all' })
  const userHasEditAccess = userCanEditUser(currentUser, terms);

  const { data: userBySlugData, loading: loadingUser } = useQuery(GetUserBySlugQuery, {
    variables: { slug: terms.slug },
    skip: !userHasEditAccess,
  });

  const userBySlug = userBySlugData?.GetUserBySlug;

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

  const onSuccess = async (user: UsersEdit) => {
    flash(`User "${userGetDisplayName(user)}" edited`);
    try {
      await client.resetStore()
    } finally {
      navigate(userGetProfileUrl(user))
    }
  }

  return (
    <div className={classes.root}>
      {loadingUser && <Loading />}
      {!loadingUser && userBySlug && (
        <UsersForm
          initialData={withDateFields(userBySlug, ['banned', 'karmaChangeLastOpened', 'lastNotificationsCheck', 'permanentDeletionRequestedAt', 'petrovLaunchCodeDate', 'petrovPressedButtonDate', 'whenConfirmationEmailSent'])}
          currentUser={currentUser}
          onSuccess={onSuccess}
          isCurrentUser={isCurrentUser}
          requestPasswordReset={requestPasswordReset}
          accountManagement={accountManagement ?? null}
        />
      )}
    </div>
  );
};

export default UsersEditForm;
