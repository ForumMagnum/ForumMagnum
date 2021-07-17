import React, { useState } from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import { Users } from '../../lib/collections/users/collection';
import { userCanEdit, userGetDisplayName, userGetProfileUrl } from '../../lib/collections/users/helpers';
import Button from '@material-ui/core/Button';
import { useCurrentUser } from '../common/withUser';
import { useNavigation } from '../../lib/routeUtil';
import { gql, useMutation, useApolloClient } from '@apollo/client';
import { useForm, Form } from '../forms/formUtil';
import classNames from 'classnames';
import { forumTypeSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: "60%",
    maxWidth: 600,
    margin: "auto",
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
  
  tabBar: {
  },
  tab: {
  },
  selectedTab: {
  },
})

const passwordResetMutation = gql`
  mutation resetPassword($email: String) {
    resetPassword(email: $email)
  }
`

const TabBar = ({currentTab, setCurrentTab, tabs, classes}: {
  currentTab: string,
  setCurrentTab: (tab: string)=>void,
  tabs: Array<{name: string, label: string}>,
  classes: ClassesType,
}) => {
  return <div className={classes.tabBar}>
    {tabs.map(tab => <div
      key={tab.name}
      className={classNames(classes.tab, {[classes.selectedTab]: tab.name===currentTab})}
      onClick={ev => setCurrentTab(tab.name)}
    >
      {tab.label}
    </div>)}
  </div>
}

const UsersEditForm = ({currentUser, terms, classes}: {
  currentUser: UsersCurrent,
  terms: {slug?: string, documentId?: string},
  classes: ClassesType,
}) => {
  const { flash } = useMessages();
  const { history } = useNavigation();
  const client = useApolloClient();
  const { FormCheckbox, FormDropdown, FormUsersList, FormDate, Typography } = Components;
  const [ mutate, loading ] = useMutation(passwordResetMutation, { errorPolicy: 'all' })

  const form = useForm({
    initialValue: currentUser as unknown as UsersEdit, //TODO
    fragmentName: "UsersEdit",
    onChange: (change: Partial<UsersEdit>) => {
      // eslint-disable-next-line no-console
      console.log("User change:");
      // eslint-disable-next-line no-console
      console.log(change);
      // TODO
    },
  });
  
  const [currentTab,setCurrentTab] = useState<string>("profile");

  if(!terms.slug && !terms.documentId) {
    // No user specified and not logged in
    return (
      <div className={classes.root}>
        Log in to edit your profile.
      </div>
    );
  }
  if (!userCanEdit(currentUser,
    terms.documentId ? {_id: terms.documentId} : {slug: terms.slug})) {
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
  
  return <div className={classes.root}>
    <Typography variant="display2" className={classes.header}>Edit Account</Typography>
    
    <Typography variant="display2" className={classes.header}>Edit Account</Typography>
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

    {/*<Components.WrappedSmartForm
      collection={Users}
      {...terms}
      successCallback={async (user) => {
        flash(`User "${userGetDisplayName(user)}" edited`);
        await client.resetStore()
        history.push(userGetProfileUrl(user));
      }}
      queryFragment={getFragment('UsersEdit')}
      mutationFragment={getFragment('UsersEdit')}
      showRemove={false}
    />*/}
    
    <TabBar
      currentTab={currentTab} setCurrentTab={setCurrentTab}
      classes={classes}
      tabs={[
        {name: "profile", label: "Profile"},
        {name: "notifications", label: "Notifications"},
        {name: "customization", label: "Customization"},
        {name: "moderationGuidelines", label: "Moderation Guidelines"},
        {name: "admin", label: "Admin"},
      ]}
    />
    
    <Form form={form}>
      {currentTab==="profile" && <div>
        <h2>Profile</h2>

        <div>Reset Password</div>
        <div>Display name</div>
        <div>Email</div>
        <div>Full name</div>
        <div>Bio</div>
        <div>Location</div>
      </div>}
      {currentTab==="customization" && <div>
        <h2>Customization</h2>

        <FormDropdown form={form} fieldName="commentSorting" label="Comment Sorting" collectionName="Users" />
        <FormDropdown form={form} fieldName="sortDrafts" label="Sort Drafts by" collectionName="Users" />
        
        <FormCheckbox form={form} fieldName="hideTaggingProgressBar" label="Hide the tagging progress bar"/>
        <FormCheckbox form={form} fieldName="hideFrontpageBookAd" label="Hide the frontpage book ad"/>
        <FormCheckbox form={form} fieldName="hideIntercom" label="Hide Intercom"/>
        <FormCheckbox form={form} fieldName="beta" label="Opt into experimental features"/>
        <FormCheckbox form={form} fieldName="markDownPostEditor" label="Activate Markdown editor"/>
        <FormCheckbox form={form} fieldName="reenableDraftJs" label="Use the previous WYSIWYG editor"/>
        <FormCheckbox form={form} fieldName="hideElicitPredictions" label="Hide others users' Elicit predictions until I have predicted myself"/>

        <h2>Comment Truncation Options</h2>
        <FormCheckbox form={form} fieldName="noSingleLineComments" label="Do not collapse comments to Single Line"/>
        <FormCheckbox form={form} fieldName="noCollapseCommentsPosts" label="Do not truncate comments (in large threads on Post Pages)"/>
        <FormCheckbox form={form} fieldName="noCollapseCommentsFrontpage" label="Do not truncate comments (on home page)"/>
      </div>}
      {currentTab==="notifications" && <div>
        <h2>Notifications</h2>
        <div>Manage Active Subscriptions</div>
        <FormCheckbox form={form} fieldName="auto_subscribe_to_my_posts" label="Auto-subscribe to comments on my posts"/>
        <FormCheckbox form={form} fieldName="auto_subscribe_to_my_comments" label="Auto-subscribe to replies to my comments"/>
        <FormCheckbox form={form} fieldName="autoSubscribeAsOrganizer" label="Auto-subscribe to posts and meetups in groups I organize"/>

        <div>Comments on posts I'm subscribed to</div>
        <div>Shortform by users I'm subscribed to</div>
        <div>Replies to my comments</div>
        <div>Replies to comments I'm subscribed to</div>
        <div>Posts by users I'm subscribed to</div>
        <div>Posts/events in groups I'm subscribed to</div>
        <div>Posts added to tags I'm subscribed to</div>
        <div>Private messages</div>
        <div>Draft shared with me</div>
        <div>New Events in my notification radius</div>

        <div>Vote Notifications</div>

        <h2>Emails</h2>
        <div>(Verification status)</div>
        <div>Email me new posts in Curated</div>
        <div>Do not send me any emails (unsubscribe from all)</div>
      </div>}
      {currentTab==="moderationGuidelines" && <div>
        <h2>Moderation Guidelines for My Posts</h2>
        
        <FormDropdown form={form} fieldName="moderationStyle" label="Style" collectionName="Users"/>
        <FormCheckbox form={form} fieldName="moderatorAssistance" label="I'm happy for LW site moderators to help enforce my policy"/>
        <FormCheckbox form={form} fieldName="collapseModerationGuidelines" label="On my posts, collapse my moderation guidelines by default"/>
        
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
        <div>Groups</div>
      </div>}
    </Form>
    
  </div>
};


const UsersEditFormComponent = registerComponent('UsersEditForm', UsersEditForm, {styles});

declare global {
  interface ComponentTypes {
    UsersEditForm: typeof UsersEditFormComponent
  }
}
