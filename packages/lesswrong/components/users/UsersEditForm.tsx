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
  const { FormCheckbox, Typography } = Components;
  const [ mutate, loading ] = useMutation(passwordResetMutation, { errorPolicy: 'all' })

  const form = useForm({
    initialValue: currentUser,
    fragmentName: "UsersCurrent",
    onChange: (change: Partial<UsersCurrent>) => {
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
      </div>}
      {currentTab==="notifications" && <div>
        <h2>Notifications</h2>
      </div>}
      {currentTab==="customization" && <div>
        <h2>Customization</h2>
        
        <FormCheckbox form={form} fieldName="hideIntercom" label="Hide Intercom"/>
      </div>}
    </Form>
    
    { /*
    {isCurrentUser && <Button
      color="secondary"
      variant="outlined"
      className={classes.resetButton}
      onClick={requestPasswordReset}
    >
      Reset Password
    </Button>}

    <Components.WrappedSmartForm
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
    />
    */ }
  </div>
};


const UsersEditFormComponent = registerComponent('UsersEditForm', UsersEditForm, {styles});

declare global {
  interface ComponentTypes {
    UsersEditForm: typeof UsersEditFormComponent
  }
}
