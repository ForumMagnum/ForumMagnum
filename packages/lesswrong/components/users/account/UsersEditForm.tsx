import { useMessages } from '@/components/common/withMessages';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { EditableUser, getUserEmail, SOCIAL_MEDIA_PROFILE_FIELDS, userCanEditUser, userGetDisplayName, userGetProfileUrl } from '@/lib/collections/users/helpers';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useCurrentUser } from '@/components/common/withUser';
import { gql, useMutation, useApolloClient } from '@apollo/client';
import { hasEventsSetting, isAF, isEAForum, isLW, isLWorAF, verifyEmailsSetting } from '@/lib/instanceSettings';
import { useThemeOptions, useSetTheme } from '@/components/themes/useTheme';
import { captureEvent } from '@/lib/analyticsEvents';
import { configureDatadogRum } from '@/client/datadogRum';
import { isBookUI, isFriendlyUI, preferredHeadingCase } from '@/themes/forumTheme';
import { useLocation, useNavigate } from '@/lib/routeUtil.tsx';
import { Components, registerComponent } from "@/lib/vulcan-lib/components.tsx";
import { useGetUserBySlug } from '@/components/hooks/useGetUserBySlug';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { submitButtonStyles } from '@/components/tanstack-form-components/TanStackSubmit';
import { LegacyFormGroupLayout } from '@/components/tanstack-form-components/LegacyFormGroupLayout';
import { getUpdatedFieldValues } from '@/components/tanstack-form-components/helpers';
import { FormComponentCheckbox } from '@/components/form-components/FormComponentCheckbox';
import { useEditorFormCallbacks, EditorFormComponent } from '@/components/editor/EditorFormComponent';
import { LocationFormComponent } from '@/components/form-components/LocationFormComponent';
import { MuiTextField } from '@/components/form-components/MuiTextField';
import { FormUserMultiselect } from '@/components/form-components/UserMultiselect';
import { useUpdate } from '@/lib/crud/withUpdate';
import { defaultEditorPlaceholder } from '@/lib/editor/make_editable';
import { useForm } from '@tanstack/react-form';
import classNames from 'classnames';
import { getCommentViewOptions } from '@/lib/commentViewOptions';
import { FormComponentSelect } from '@/components/form-components/FormComponentSelect';
import { userHasntChangedName, userIsAdmin, userIsAdminOrMod, userIsMemberOf } from '@/lib/vulcan-users/permissions';
import { FormComponentDatePicker } from '@/components/form-components/FormComponentDateTime';
import { allowSubscribeToSequencePosts, hasAccountDeletionFlow, hasPostRecommendations, hasSurveys, userCanViewJargonTerms } from '@/lib/betas';
import { GROUP_OPTIONS, REACT_PALETTE_STYLE_OPTIONS, SORT_DRAFTS_BY_OPTIONS } from '@/lib/collections/users/newSchema';
import { ThemeSelect } from '@/components/form-components/ThemeSelect';
import { EmailConfirmationRequiredCheckbox } from '../EmailConfirmationRequiredCheckbox';
import { FormComponentCheckboxGroup } from '@/components/form-components/FormComponentCheckboxGroup';
import { ManageSubscriptionsLink } from '@/components/form-components/ManageSubscriptionsLink';
import { MODERATION_GUIDELINES_OPTIONS } from '@/lib/collections/posts/constants';
import { HIGHLIGHT_DURATION } from '@/components/comments/CommentFrame';

const styles = defineStyles('UsersEditForm', (theme: ThemeType) => ({
  root: {
    ...(isFriendlyUI && {
      "& .form-submit": {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        marginRight: 5,
      },
    }),
  },
  resetButton: {
    marginBottom: theme.spacing.unit * 4
  },
  defaultGroup: {
    paddingLeft: theme.spacing.unit * 2,
    paddingRight: theme.spacing.unit * 2,
  },
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
  '@keyframes higlight-animation': {
    from: {
      // In most cases it would look better with a border. But because this has to support so many different components, it's hard to know what the border should be, so instead just use a background color.
      backgroundColor: theme.palette.panelBackground.commentHighlightAnimation,
      borderRadius: 5,
    },
    to: {
      backgroundColor: "none",
      borderRadius: 5,
    }
  },
  highlightAnimation: {
    animation: `higlight-animation ${HIGHLIGHT_DURATION}s ease-in-out 0s;`
  },
}));

const HighlightableField = ({ name, children }: { name: string, children: React.ReactNode }) => {
  const classes = useStyles(styles);
  const [highlight, setHighlight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { query } = useLocation();

  // If highlightField is set to this field, scroll it into view and highlight it
  useEffect(() => {
    if (name && name === query?.highlightField) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      setHighlight(true);
      setTimeout(() => {
        setHighlight(false);
      }, HIGHLIGHT_DURATION * 1000);
    }
  }, [name, query?.highlightField]);

  return <div className={classNames(highlight && classes.highlightAnimation)} ref={scrollRef}>{children}</div>;
};

const privilegeCheckboxFields = [
  { fieldName: "postingDisabled", label: "Posting disabled" },
  { fieldName: "allCommentingDisabled", label: "All commenting disabled" },
  { fieldName: "commentingOnOtherUsersDisabled", label: "Commenting on other users disabled" },
  { fieldName: "conversationsDisabled", label: "Conversations disabled" },
] as const;

const UsersForm = ({
  initialData,
  currentUser,
  onSuccess,
}: {
  initialData: EditableUser;
  currentUser: UsersCurrent;
  onSuccess: (doc: UsersEdit) => void;
}) => {
  const { LWTooltip, Error404, PrefixedInput, NotificationTypeSettingsWidget, KarmaChangeNotifierSettings, UsersEmailVerification } = Components;

  const classes = useStyles(styles);
  const { query } = useLocation();

  const highlightedField = query?.highlightField ?? null;
  
  const formType = 'edit';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<UsersEdit>();

  const { mutate } = useUpdate({
    collectionName: 'Users',
    fragmentName: 'UsersEdit',
  });

  const form = useForm({
    defaultValues: {
      ...initialData,

      sunshineFlagged: initialData?.sunshineFlagged ?? false,
      needsReview: initialData?.needsReview ?? false,
      sunshineSnoozed: initialData?.sunshineSnoozed ?? false,

      reviewedAt: initialData?.reviewedAt ?? null,
      defaultToCKEditor: initialData?.defaultToCKEditor ?? null,
    },
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();

      let result: UsersEdit;

      const updatedFields = getUpdatedFieldValues(formApi);
      const { data } = await mutate({
        selector: { _id: initialData?._id },
        data: updatedFields,
      });
      result = data?.updateUser.data;

      onSuccessCallback.current?.(result);

      onSuccess(result);
    },
  });

  if (formType === 'edit' && !initialData) {
    return <Error404 />;
  }

  const showAdminGroup = userIsAdmin(currentUser) || userIsMemberOf(currentUser, 'realAdmins') || userIsMemberOf(currentUser, 'alignmentForumAdmins');

  return (
    <form className="vulcan-form" onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      void form.handleSubmit();
    }}>
      <div className={classes.defaultGroup}>
        {!isFriendlyUI && (userHasntChangedName(form.state.values) || userIsAdminOrMod(currentUser)) && <div className={classes.fieldWrapper}>
          <form.Field name="displayName">
            {(field) => (
              <MuiTextField
                field={field}
                label="Display name"
              />
            )}
          </form.Field>
        </div>}

        {userIsAdminOrMod(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="previousDisplayName">
            {(field) => (
              <MuiTextField
                field={field}
                label="Previous display name"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="email">
            {(field) => (
              <MuiTextField
                field={field}
                disabled={isEAForum && !form.state.values.hasAuth0Id}
                label="Email"
              />
            )}
          </form.Field>
        </div>

        {isLWorAF && <div className={classes.fieldWrapper}>
          <form.Field name="fullName">
            {(field) => (
              <MuiTextField
                field={field}
                label="Full name"
              />
            )}
          </form.Field>
        </div>}

        {!isEAForum && <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
          <form.Field name="biography">
            {(field) => (
              <EditorFormComponent
                field={field}
                name="biography"
                formType={formType}
                document={form.state.values}
                addOnSubmitCallback={addOnSubmitCallback}
                addOnSuccessCallback={addOnSuccessCallback}
                hintText="Tell us about yourself"
                fieldName="biography"
                collectionName="Users"
                label="Bio"
                commentEditor={true}
                commentStyles={true}
                hideControls={false}
              />
            )}
          </form.Field>
        </div>}
      </div>

      <LegacyFormGroupLayout label={preferredHeadingCase("Site Customizations")} startCollapsed={true && highlightedField !== "googleLocation"}>
        {!isLWorAF && <div className={classes.fieldWrapper}>
          <form.Field name="theme">
            {(field) => (
              <ThemeSelect
                field={field}
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="commentSorting">
            {(field) => (
              <FormComponentSelect
                field={field}
                options={getCommentViewOptions()}
                label="Comment sorting"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="sortDraftsBy">
            {(field) => (
              <FormComponentSelect
                field={field}
                options={SORT_DRAFTS_BY_OPTIONS}
                label="Sort Drafts by"
              />
            )}
          </form.Field>
        </div>

        {isLW && <div className={classes.fieldWrapper}>
          <form.Field name="hideFrontpageMap">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Hide the frontpage map"
              />
            )}
          </form.Field>
        </div>}

        {isLWorAF && <div className={classes.fieldWrapper}>
          <form.Field name="hideFrontpageBook2020Ad">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Hide the frontpage book ad"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="noKibitz">
            {(field) => (
              <LWTooltip title="For if you want to not be biased. Adds an option to the user menu to temporarily disable. Does not work well on mobile" placement="left-start" inlineBlock={false}>
                <FormComponentCheckbox
                  field={field}
                  label="Hide author names until I hover over them"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>

        {isEAForum && (userIsAdminOrMod(currentUser) || userIsMemberOf(currentUser, 'trustLevel1')) && <div className={classes.fieldWrapper}>
          <form.Field name="showHideKarmaOption">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Enable option on posts to hide karma visibility"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="beta">
            {(field) => (
              <LWTooltip title="Get early access to new in-development features" placement="left-start" inlineBlock={false}>
                <FormComponentCheckbox
                  field={field}
                  label="Opt into experimental (beta) features"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="hideIntercom">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Hide Intercom"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="markDownPostEditor">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Activate Markdown Editor"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="hideElicitPredictions">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Hide other users' Elicit predictions until I have predicted myself"
              />
            )}
          </form.Field>
        </div>

        {isAF && <div className={classes.fieldWrapper}>
          <form.Field name="hideAFNonMemberInitialWarning">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Hide explanations of how AIAF submissions work for non-members"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="noSingleLineComments">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Do not collapse comments to Single Line"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="noCollapseCommentsPosts">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Do not truncate comments (in large threads on Post Pages)"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="noCollapseCommentsFrontpage">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Do not truncate comments (on home page)"
              />
            )}
          </form.Field>
        </div>

        {isEAForum && <div className={classes.fieldWrapper}>
          <form.Field name="hideCommunitySection">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Hide community section from the frontpage"
              />
            )}
          </form.Field>
        </div>}

        {isEAForum && <div className={classes.fieldWrapper}>
          <form.Field name="showCommunityInRecentDiscussion">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Show Community posts in Recent Discussion"
              />
            )}
          </form.Field>
        </div>}

        {hasPostRecommendations && <div className={classes.fieldWrapper}>
          <form.Field name="hidePostsRecommendations">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Hide recommendations from the posts page"
              />
            )}
          </form.Field>
        </div>}

        {hasSurveys && <div className={classes.fieldWrapper}>
          <form.Field name="optedOutOfSurveys">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Opt out of user surveys"
              />
            )}
          </form.Field>
        </div>}

        {userCanViewJargonTerms(form.state.values) && <div className={classes.fieldWrapper}>
          <form.Field name="postGlossariesPinned">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Pin glossaries on posts, and highlight all instances of each term"
              />
            )}
          </form.Field>
        </div>}

        {hasEventsSetting.get() && <HighlightableField name="googleLocation">
          <div className={classes.fieldWrapper}>
          <form.Field name="googleLocation">
            {(field) => (
              <LocationFormComponent
                field={field}
                stringVersionFieldName="location"
                label="Account location (used for location-based recommendations)"
              />
            )}
          </form.Field>
          </div>
        </HighlightableField>}

        {/* TODO: add custom validation (simpleSchema present) */}
        {/* TODO: custom hidden prop; implement conditional visibility for mapLocation */}
        {!isEAForum && <div className={classes.fieldWrapper}>
          <form.Field name="mapLocation">
            {(field) => (
              <LocationFormComponent
                field={field}
                variant="grey"
                label="Public map location"
              />
            )}
          </form.Field>
        </div>}

        {!isEAForum && <div className={classes.fieldWrapper}>
          <form.Field name="reactPaletteStyle">
            {(field) => (
              <FormComponentSelect
                field={field}
                options={REACT_PALETTE_STYLE_OPTIONS}
                label="React Palette Style"
              />
            )}
          </form.Field>
        </div>}
      </LegacyFormGroupLayout>

      <LegacyFormGroupLayout label="Notifications" startCollapsed={true && (!highlightedField || !["auto_subscribe_to_my_posts", "notificationSubscribedTagPost", "karmaChangeNotifierSettings"].includes(highlightedField))}>
        <HighlightableField name="auto_subscribe_to_my_posts">
        <div className={classes.fieldWrapper}>
          <form.Field name="auto_subscribe_to_my_posts">
            {(field) => (<>
              <ManageSubscriptionsLink />
              <FormComponentCheckbox
                field={field}
                label="Auto-subscribe to comments on my posts"
              />
            </>)}
          </form.Field>
        </div>
        </HighlightableField>

        <div className={classes.fieldWrapper}>
          <form.Field name="auto_subscribe_to_my_comments">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Auto-subscribe to replies to my comments"
              />
            )}
          </form.Field>
        </div>

        {hasEventsSetting.get() && <div className={classes.fieldWrapper}>
          <form.Field name="autoSubscribeAsOrganizer">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Auto-subscribe to posts/events in groups I organize"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="notificationCommentsOnSubscribedPost">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="Comments on posts/events I'm subscribed to"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="notificationShortformContent">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label={`${isEAForum ? "Quick takes" : "Shortform"} by users I'm subscribed to`}
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="notificationRepliesToMyComments">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="Replies to my comments"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="notificationRepliesToSubscribedComments">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="Replies to comments I'm subscribed to"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="notificationSubscribedUserPost">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="Posts by users I'm subscribed to"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="notificationSubscribedUserComment">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="Comments by users I'm subscribed to"
              />
            )}
          </form.Field>
        </div>

        {hasEventsSetting.get() && <div className={classes.fieldWrapper}>
          <form.Field name="notificationPostsInGroups">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="Posts/events in groups I'm subscribed to"
              />
            )}
          </form.Field>
        </div>}

        <HighlightableField name="notificationSubscribedTagPost">
        <div className={classes.fieldWrapper}>
          <form.Field name="notificationSubscribedTagPost">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="Posts added to tags I'm subscribed to"
              />
            )}
          </form.Field>
        </div>
        </HighlightableField>

        {allowSubscribeToSequencePosts && <div className={classes.fieldWrapper}>
          <form.Field name="notificationSubscribedSequencePost">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="Posts added to sequences I'm subscribed to"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="notificationPrivateMessage">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="Private messages"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="notificationSharedWithMe">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="Draft shared with me"
              />
            )}
          </form.Field>
        </div>

        {isLWorAF && <div className={classes.fieldWrapper}>
          <form.Field name="notificationAlignmentSubmissionApproved">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="Alignment Forum submission approvals"
              />
            )}
          </form.Field>
        </div>}

        {hasEventsSetting.get() && <div className={classes.fieldWrapper}>
          <form.Field name="notificationEventInRadius">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="New events in my notification radius"
              />
            )}
          </form.Field>
        </div>}

        {hasEventsSetting.get() && <div className={classes.fieldWrapper}>
          <form.Field name="notificationRSVPs">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="New RSVP responses to my events"
              />
            )}
          </form.Field>
        </div>}

        {hasEventsSetting.get() && <div className={classes.fieldWrapper}>
          <form.Field name="notificationGroupAdministration">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="Group administration notifications"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="notificationCommentsOnDraft">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="Comments on unpublished draft posts I've shared"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="notificationSubforumUnread">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="New discussions in topics I'm subscribed to"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="notificationNewMention">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="Someone has mentioned me in a post or a comment"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="notificationDialogueMessages">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="New dialogue content in a dialogue I'm participating in"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="notificationPublishedDialogueMessages">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="New dialogue content in a dialogue I'm subscribed to"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="notificationAddedAsCoauthor">
            {(field) => (
              <NotificationTypeSettingsWidget
                field={field}
                label="Someone has added me as a coauthor to a post"
              />
            )}
          </form.Field>
        </div>

        <HighlightableField name="karmaChangeNotifierSettings">
        <div className={classes.fieldWrapper}>
          <form.Field name="karmaChangeNotifierSettings">
            {(field) => (
              <KarmaChangeNotifierSettings
                field={field}
              />
            )}
          </form.Field>
        </div>
        </HighlightableField>
      </LegacyFormGroupLayout>

      <LegacyFormGroupLayout label="Emails" startCollapsed={true && highlightedField !== "subscribedToDigest"}>
        {/* TODO: 'UsersEmailVerification' not yet ported - implement TanStackUsersEmailVerification */}
        {verifyEmailsSetting.get() && <div className={classes.fieldWrapper}>
          <form.Field name="whenConfirmationEmailSent">
            {() => <UsersEmailVerification />}
          </form.Field>
        </div>}

        {isLW && <div className={classes.fieldWrapper}>
          <form.Field name="emailSubscribedToCurated">
            {(field) => (
              <EmailConfirmationRequiredCheckbox
                field={field}
                label="Email me new posts in Curated"
              />
            )}
          </form.Field>
        </div>}

        {isEAForum && <HighlightableField name="subscribedToDigest">
          <div className={classes.fieldWrapper}>
          <form.Field name="subscribedToDigest">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Subscribe to the EA Forum Digest emails"
              />
            )}
          </form.Field>
        </div>
        </HighlightableField>}

        <div className={classes.fieldWrapper}>
          <form.Field name="unsubscribeFromAll">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Do not send me any emails (unsubscribe from all)"
              />
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>

      {isEAForum && <LegacyFormGroupLayout label={preferredHeadingCase("Privacy Settings")} startCollapsed={true}>
        <div className={classes.fieldWrapper}>
          <form.Field name="hideFromPeopleDirectory">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Hide my profile from the People directory"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="allowDatadogSessionReplay">
            {(field) => (
              <LWTooltip title="Allow us to capture a video-like recording of your browser session (using Datadog Session Replay) — this is useful for debugging and improving the site." placement="left-start" inlineBlock={false}>
                <FormComponentCheckbox
                  field={field}
                  label="Allow Session Replay"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>}

      {userIsAdminOrMod(currentUser) && <LegacyFormGroupLayout label={preferredHeadingCase("Admin Options")} startCollapsed={true}>
        {isEAForum && <div className={classes.fieldWrapper}>
          <form.Field name="twitterProfileURLAdmin">
            {(field) => (
              <PrefixedInput
                field={field}
                inputPrefix={SOCIAL_MEDIA_PROFILE_FIELDS.twitterProfileURL}
                heading="Social media (private, for admin use)"
                smallBottomMargin={false}
              />
            )}
          </form.Field>
        </div>}

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="slug">
            {(field) => (
              <MuiTextField
                field={field}
                label="Slug"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="noindex">
            {(field) => (
              <LWTooltip title="Hide this user's profile from search engines" placement="left-start" inlineBlock={false}>
                <FormComponentCheckbox
                  field={field}
                  label="No Index"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="sunshineNotes">
            {(field) => (
              <MuiTextField
                field={field}
                label="Sunshine notes"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="sunshineFlagged">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Sunshine flagged"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="needsReview">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Needs review"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="sunshineSnoozed">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Sunshine snoozed"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="snoozedUntilContentCount">
            {(field) => (
              <MuiTextField
                field={field}
                type="number"
                label="Snoozed until content count"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="reviewedByUserId">
            {(field) => (
              <MuiTextField
                field={field}
                label="Reviewed by user ID"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="reviewedAt">
            {(field) => (
              <FormComponentDatePicker
                field={field}
                // type="date"
                // InputLabelProps={{ shrink: true }}
                label="Reviewed at"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="shortformFeedId">
            {(field) => (
              <MuiTextField
                field={field}
                label="Quick takes feed ID"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="viewUnreviewedComments">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="View unreviewed comments"
              />
            )}
          </form.Field>
        </div>

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="defaultToCKEditor">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Activate CKEditor by default"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="signUpReCaptchaRating">
            {(field) => (
              <LWTooltip title="Edit this number to '1' if you're confiden they're not a spammer" placement="left-start" inlineBlock={false}>
                <MuiTextField
                  field={field}
                  type="number"
                  label="Sign up re captcha rating"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="abTestKey">
            {(field) => (
              <MuiTextField
                field={field}
                label="Ab test key"
              />
            )}
          </form.Field>
        </div>}

        {isLWorAF && userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="hideSunshineSidebar">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Hide Sunshine Sidebar"
              />
            )}
          </form.Field>
        </div>}
      </LegacyFormGroupLayout>}

      {isLWorAF && userIsAdmin(currentUser) && <LegacyFormGroupLayout label="Prize/Payment Info" startCollapsed={false}>
        <div className={classes.fieldWrapper}>
          <form.Field name="paymentEmail">
            {(field) => (
              <LWTooltip title="An email you'll definitely check where you can receive information about receiving payments" placement="left-start" inlineBlock={false}>
                <MuiTextField
                  field={field}
                  label="Payment Contact Email"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="paymentInfo">
            {(field) => (
              <LWTooltip title="Your PayPal account info, for sending small payments" placement="left-start" inlineBlock={false}>
                <MuiTextField
                  field={field}
                  label="PayPal Info"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>}

      {userIsAdminOrMod(currentUser) && <LegacyFormGroupLayout label={preferredHeadingCase("Disabled Privileges")} startCollapsed={true}>
        {privilegeCheckboxFields.map(({ fieldName, label }, idx) => (
          <div className={classes.fieldWrapper} key={idx}>
            <form.Field name={fieldName}>
              {(field) => (
                <FormComponentCheckbox
                  field={field}
                  label={label}
                />
              )}
            </form.Field>
          </div>
        ))}
      </LegacyFormGroupLayout>}

      {userIsAdminOrMod(currentUser) && <LegacyFormGroupLayout label={preferredHeadingCase("Ban & Purge User")} startCollapsed={true}>
        <div className={classes.fieldWrapper}>
          <form.Field name="nullifyVotes">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Nullify all past votes"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="deleteContent">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Delete all user content"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="banned">
            {(field) => (
              <FormComponentDatePicker
                field={field}
                label="Ban user until"
              />
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>}

      <LegacyFormGroupLayout label={preferredHeadingCase(isFriendlyUI ? "Moderation" : "Moderation & Moderation Guidelines")} startCollapsed={true}>
        {!isEAForum && <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
          <form.Field name="moderationGuidelines">
            {(field) => (
              <EditorFormComponent
                field={field}
                name="moderationGuidelines"
                formType={formType}
                document={form.state.values}
                addOnSubmitCallback={addOnSubmitCallback}
                addOnSuccessCallback={addOnSuccessCallback}
                hintText={defaultEditorPlaceholder}
                fieldName="moderationGuidelines"
                collectionName="Users"
                commentEditor={true}
                commentStyles={true}
                hideControls={false}
              />
            )}
          </form.Field>
        </div>}

        {!isEAForum && <div className={classes.fieldWrapper}>
          <form.Field name="moderationStyle">
            {(field) => (
              <FormComponentSelect
                field={field}
                options={MODERATION_GUIDELINES_OPTIONS}
                label="Style"
              />
            )}
          </form.Field>
        </div>}

        {!isEAForum && <div className={classes.fieldWrapper}>
          <form.Field name="moderatorAssistance">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="I'm happy for site moderators to help enforce my policy"
              />
            )}
          </form.Field>
        </div>}

        {!isEAForum && <div className={classes.fieldWrapper}>
          <form.Field name="collapseModerationGuidelines">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="On my posts, collapse my moderation guidelines by default"
              />
            )}
          </form.Field>
        </div>}

        {(userIsAdminOrMod(currentUser) || userIsMemberOf(currentUser, 'trustLevel1')) && <div className={classes.fieldWrapper}>
          <form.Field name="bannedUserIds">
            {(field) => (
              <FormUserMultiselect
                field={field}
                label="Banned Users (All)"
              />
            )}
          </form.Field>
        </div>}

        {(userIsAdminOrMod(currentUser) || userIsMemberOf(currentUser, 'canModeratePersonal')) && <div className={classes.fieldWrapper}>
          <form.Field name="bannedPersonalUserIds">
            {(field) => (
              <LWTooltip title="Users who are banned from commenting on your personal blogposts (will not affect posts promoted to frontpage)" placement="left-start" inlineBlock={false}>
                <FormUserMultiselect
                  field={field}
                  label="Banned Users (Personal)"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>}
      </LegacyFormGroupLayout>

      {showAdminGroup && <LegacyFormGroupLayout label="Admin">
        {(userIsAdmin(currentUser) || userIsMemberOf(currentUser, 'realAdmins')) && <div className={classes.fieldWrapper}>
          <form.Field name="isAdmin">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Admin"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="groups">
            {(field) => (
              <FormComponentCheckboxGroup
                field={field}
                options={GROUP_OPTIONS}
                label="Groups"
              />
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>}

      {!hasAccountDeletionFlow && <LegacyFormGroupLayout label={preferredHeadingCase("Deactivate Account")} startCollapsed={true}>
        <div className={classes.fieldWrapper}>
          <form.Field name="deleted">
            {(field) => (
              <LWTooltip title="Your posts and comments will be listed as '[Anonymous]', and your user profile won't accessible." placement="left-start" inlineBlock={false}>
                <FormComponentCheckbox
                  field={field}
                  label="Deactivate"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>}

      <div className="form-submit">
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              variant={isBookUI ? 'outlined' : undefined}
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={classNames("primary-form-submit-button", classes.submitButton)}
            >
              Submit
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
};

const UsersEditForm = ({ terms }: {
  terms: { slug: string },
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const navigate = useNavigate();
  const client = useApolloClient();
  const { ErrorAccessDenied } = Components;
  const [mutate, loading] = useMutation(gql`
    mutation resetPassword($email: String) {
      resetPassword(email: $email)
    }
  `, { errorPolicy: 'all' })
  const currentThemeOptions = useThemeOptions();
  const setTheme = useSetTheme();

  const userHasEditAccess = userCanEditUser(currentUser, terms);

  const { user: userBySlug, loading: loadingUser } = useGetUserBySlug(terms.slug, { fragmentName: 'UsersEdit', skip: !userHasEditAccess });

  if (!userHasEditAccess || !currentUser) {
    return <ErrorAccessDenied />;
  }
  const isCurrentUser = (terms.slug === currentUser?.slug)

  // currentUser will not be the user being edited in the case where current
  // user is an admin. This component does not have access to the user email at
  // all in admin mode unfortunately. In the fullness of time we could fix that,
  // currently we disable it below
  const requestPasswordReset = async () => {
    const { data } = await mutate({ variables: { email: getUserEmail(currentUser) } })
    flash(data?.resetPassword)
  }

  const onSuccess = async (user: UsersEdit) => {
    if (user?.theme.name) {
      const name = user.theme.name;
      const theme = { ...currentThemeOptions, ...user.theme, name };
      setTheme(theme);
      captureEvent("setUserTheme", theme);
    }

    // reconfigure datadog RUM in case they have changed their settings
    configureDatadogRum(user)

    flash(`User "${userGetDisplayName(user)}" edited`);
    try {
      await client.resetStore()
    } finally {
      navigate(userGetProfileUrl(user))
    }
  }

  return (
    <div className={classes.root}>
      {/* TODO(EA): Need to add a management API call to get the reset password
          link, but for now users can reset their password from the login
          screen */}
      {isCurrentUser && !isEAForum && <Button
        color="secondary"
        variant="outlined"
        className={classes.resetButton}
        onClick={requestPasswordReset}
      >
        {preferredHeadingCase("Reset Password")}
      </Button>}

      {loadingUser && <Components.Loading />}
      {!loadingUser && userBySlug && (
        <UsersForm
          initialData={userBySlug}
          currentUser={currentUser}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
};


const UsersEditFormComponent = registerComponent('UsersEditForm', UsersEditForm);

declare global {
  interface ComponentTypes {
    UsersEditForm: typeof UsersEditFormComponent
  }
}
