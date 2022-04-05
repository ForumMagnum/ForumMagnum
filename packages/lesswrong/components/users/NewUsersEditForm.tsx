import React, { useState } from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import { Users } from '../../lib/collections/users/collection';
import { userCanEdit, userGetDisplayName, userGetProfileUrl } from '../../lib/collections/users/helpers';
import Button from '@material-ui/core/Button';
import { useCurrentUser } from '../common/withUser';
import { useNavigation } from '../../lib/routeUtil';
import { gql, useMutation, useApolloClient } from '@apollo/client';
import { useAutosavingEditForm, Form } from '../forms/formUtil';
import classNames from 'classnames';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { userIsMemberOf } from '../../lib/vulcan-users/permissions';
import { sunshineRegimentGroup } from '../../lib/permissions';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 100,
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    }
  },

  header: {
    margin: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 4,
    [theme.breakpoints.down('md')]: {
      marginLeft: theme.spacing.unit/2,
    },
  },
  resetButton: {
    marginBottom:theme.spacing.unit * 4
  },
  
})

const passwordResetMutation = gql`
  mutation resetPassword($email: String) {
    resetPassword(email: $email)
  }
`

const NewUsersEditForm = ({currentUser, terms, classes}: {
  currentUser: UsersCurrent,
  terms: {slug?: string, documentId?: string},
  classes: ClassesType,
}) => {
  const { flash } = useMessages();
  const { history } = useNavigation();
  const client = useApolloClient();
  const { FormCheckbox, FormDropdown, FormEditor, FormUsersList, FormDate, FormMultilineText, FormTextbox, FormLocation, FormNotificationTypeSettings, FormKarmaChangeNotifierSettings, FormUserPermissionGroupMemberships, Typography, TabBar, Loading, ManageSubscriptionsLink, UsersEmailVerification } = Components;
  const [ mutate, loading ] = useMutation(passwordResetMutation, { errorPolicy: 'all' })
  //const updateCurrentUser = useUpdateCurrentUser();

  const form = useAutosavingEditForm({
    documentId: currentUser._id,
    collectionName: "Users",
    fragmentName: "UsersEdit",
    onChange: async (change: Partial<UsersEdit>) => {
      flash("Saved changes.");
    },
  });
  
  const [currentTab,setCurrentTab] = useState<string|null>(null);

  if(!terms.slug && !terms.documentId) {
    // No user specified and not logged in
    return (
      <div className={classes.root}>
        Log in to edit your profile.
      </div>
    );
  }
  if (!userCanEdit(currentUser,
    terms.documentId ? {_id: terms.documentId} : {slug: terms.slug}))
  {
    return <span>Sorry, you do not have permission to do this at this time.</span>
  }

  // currentUser will not be the user being edited in the case where current
  // user is an admin. This component does not have access to the user email at
  // all in admin mode unfortunately. In the fullness of time we could fix that,
  // currently we disable it below
  const requestPasswordReset = async () => {
    const { data } = await mutate({variables: { email: currentUser?.emails[0]?.address }})
    flash(data?.resetPassword)
  }

  // Since there are two urls from which this component can be rendered, with different terms, we have to
  // check both slug and documentId
  const isCurrentUser = (terms.slug && terms.slug === currentUser?.slug) || (terms.documentId && terms.documentId === currentUser?._id)
  
  let userIsSunshine = userIsMemberOf(currentUser, "sunshineRegiment");
  
  if (form.loading) {
    return <div className={classes.root}>
      <Loading/>
    </div>
  }
  
  return <div className={classes.root}>
    <TabBar
      smallScreenHeading="Account Settings"
      currentTab={currentTab} setCurrentTab={setCurrentTab}
      tabs={[
        {name: "account", label: "Account"},
        {name: "notifications", label: "Notifications"},
        {name: "customization", label: "Customization"},
        {name: "moderationGuidelines", label: "Moderation Guidelines"},
        ...(userIsSunshine ? [{name: "admin", label: "Admin"}] : []),
      ]}
    >
    <Form form={form}>
      {currentTab==="account" && <div>
        <h2>Profile</h2>

        <FormTextbox form={form} fieldName="displayName" label="Display Name" />
        <FormTextbox form={form} fieldName="fullName" label="Full Name" />
        <FormTextbox form={form} fieldName="email" label="Email" />
        <FormLocation form={form} fieldName="location" label="Location" />
        <FormMultilineText form={form} fieldName="bio" label="Bio" />
        
        {/* TODO(EA): Need to add a management API call to get the reset password
            link, but for now users can reset their password from the login
            screen */}
        {isCurrentUser && forumTypeSetting.get() !== 'EAForum' && <Button
          color="secondary"
          variant="outlined"
          className={classes.resetButton}
          onClick={requestPasswordReset}
        >
          Reset Password
        </Button>}
      </div>}
      {currentTab==="customization" && <div>
        <h2>General</h2>
        <FormCheckbox form={form} fieldName="beta" label="Opt into experimental features"/>
        <FormCheckbox form={form} fieldName="hideElicitPredictions" label="Hide others users' Elicit predictions until I have predicted myself"/>
        
        <h2>Sorting</h2>
        <FormDropdown form={form} fieldName="commentSorting" label="Comment Sorting" collectionName="Users" />
        <FormDropdown form={form} fieldName="sortDraftsBy" label="Sort Drafts by" collectionName="Users" />
        
        <h2>Hide Elements</h2>
        <FormCheckbox form={form} fieldName="hideTaggingProgressBar" label="Hide the tagging progress bar"/>
        <FormCheckbox form={form} fieldName="hideFrontpageBookAd" label="Hide the frontpage book ad"/>
        <FormCheckbox form={form} fieldName="hideIntercom" label="Hide Intercom"/>
        
        <h2>Editor</h2>
        <FormCheckbox form={form} fieldName="markDownPostEditor" label="Activate Markdown editor"/>
        <FormCheckbox form={form} fieldName="reenableDraftJs" label="Use the previous WYSIWYG editor"/>

        <h2>Comment Truncation Options</h2>
        <FormCheckbox form={form} fieldName="noSingleLineComments" label="Do not collapse comments to Single Line"/>
        <FormCheckbox form={form} fieldName="noCollapseCommentsPosts" label="Do not truncate comments (in large threads on Post Pages)"/>
        <FormCheckbox form={form} fieldName="noCollapseCommentsFrontpage" label="Do not truncate comments (on home page)"/>
      </div>}
      {currentTab==="notifications" && <div>
        <h2>Emails</h2>
        <UsersEmailVerification/>
        {forumTypeSetting.get() !== "EAForum" && <FormCheckbox form={form} fieldName="emailSubscribedToCurated" label="Email me new posts in Curated"/>}
        {forumTypeSetting.get() === "EAForum" && <FormCheckbox form={form} fieldName="subscribedToDigest" label="Subscribe to the EA Forum Digest emails"/>}
        <FormCheckbox form={form} fieldName="unsubscribeFromAll" label="Do not send me any emails (unsubscribe from all)"/>
        
        <FormKarmaChangeNotifierSettings fieldName="karmaChangeNotifierSettings" form={form} />
        
        <h2>Subscriptions</h2>
        <ManageSubscriptionsLink/>
        <FormCheckbox form={form} fieldName="auto_subscribe_to_my_posts" label="Auto-subscribe to comments on my posts"/>
        <FormCheckbox form={form} fieldName="auto_subscribe_to_my_comments" label="Auto-subscribe to replies to my comments"/>
        <FormCheckbox form={form} fieldName="autoSubscribeAsOrganizer" label="Auto-subscribe to posts and meetups in groups I organize"/>

        <h2>Notification Types</h2>
        <FormNotificationTypeSettings form={form} fieldName="notificationCommentsOnSubscribedPost" label="Comments on posts I'm subscribed to" />
        <FormNotificationTypeSettings form={form} fieldName="notificationShortformContent" label="Shortform by users I'm subscribed to" />
        <FormNotificationTypeSettings form={form} fieldName="notificationRepliesToMyComments" label="Replies to my comments" />
        <FormNotificationTypeSettings form={form} fieldName="notificationRepliesToSubscribedComments" label="Replies to comments I'm subscribed to" />
        <FormNotificationTypeSettings form={form} fieldName="notificationSubscribedUserPost" label="Posts by users I'm subscribed to" />
        <FormNotificationTypeSettings form={form} fieldName="notificationPostsInGroups" label="Posts/events in groups I'm subscribed to" />
        <FormNotificationTypeSettings form={form} fieldName="notificationSubscribedTagPost" label="Posts added to tags I'm subscribed to" />
        <FormNotificationTypeSettings form={form} fieldName="notificationPrivateMessage" label="Private messages" />
        <FormNotificationTypeSettings form={form} fieldName="notificationSharedWithMe" label="Draft shared with me" />
        <FormNotificationTypeSettings form={form} fieldName="notificationAlignmentSubmissionApproved" label="Alignment Forum submission approvals" />
        <FormNotificationTypeSettings form={form} fieldName="notificationEventInRadius" label="New Events in my notification radius" />
        <FormNotificationTypeSettings form={form} fieldName="notificationRSVPs" label="New RSVP responses to my events" />
        <FormNotificationTypeSettings form={form} fieldName="notificationCommentsOnDraft" label="Comments on unpublished draft posts I've shared" />
      </div>}
      {currentTab==="moderationGuidelines" && <div>
        <h2>Moderation Guidelines for My Posts</h2>
        
        <FormDropdown form={form} fieldName="moderationStyle" label="Style" collectionName="Users"/>
        <FormCheckbox form={form} fieldName="moderatorAssistance" label="I'm happy for LW site moderators to help enforce my policy"/>
        <FormCheckbox form={form} fieldName="collapseModerationGuidelines" label="On my posts, collapse my moderation guidelines by default"/>
        
        <FormEditor form={form} fieldName="moderationGuidelines" placeholder="Custom moderation guidelines"/>
        
        <FormUsersList form={form} fieldName="bannedUserIds" label="Users banned from all my posts"/>
        <FormUsersList form={form} fieldName="bannedPersonalUserIds" label="Users banned from my Personal Blog posts"/>
      </div>}
      {currentTab==="admin" && <div>
        <h2>Admin Options</h2>
        
        <h3>Banning</h3>
        <FormCheckbox form={form} fieldName="voteBanned" label="Set all future votes of this user to have zero weight"/>
        <FormCheckbox form={form} fieldName="nullifyVotes" label="Nullify all past votes"/>
        <FormCheckbox form={form} fieldName="deleteContent" label="Delete all user content"/>
        <FormDate form={form} fieldName="banned" label="Ban user until"/>
        
        <h3>Permissions</h3>
        <FormCheckbox form={form} fieldName="isAdmin" label="Admin"/>
        <FormUserPermissionGroupMemberships form={form} fieldName="groups"/>
      </div>}
    </Form>
    </TabBar>
  </div>
};


const NewUsersEditFormComponent = registerComponent('NewUsersEditForm', NewUsersEditForm, {styles});

declare global {
  interface ComponentTypes {
    NewUsersEditForm: typeof NewUsersEditFormComponent
  }
}
