
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import Users from '../../lib/vulcan-users';
import Button from '@material-ui/core/Button';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { useNavigation } from '../../lib/routeUtil';
import { useApolloClient } from '@apollo/client/react/hooks/useApolloClient';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 800,
    margin: '0 auto'
  },
})

const EditProfileForm = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  // const client = useApolloClient()
  const { history } = useNavigation()
  
  const { Typography, WrappedSmartForm } = Components;
  
  if (!currentUser) {
    return (
      <div className={classes.root}>
        Log in to edit your profile
      </div>
    );
  }
  
  return (
    <div className={classes.root}>
      <Typography variant="display2" className={classes.header}>Edit Profile</Typography>
      <WrappedSmartForm
        collection={Users}
        terms={{documentId: currentUser._id}}
        fields={[
          'linkedinProfileURL',
          'facebookProfileURL',
          'twitterProfileURL',
          'githubProfileURL',
          'youtubeProfileURL',
          'website'
        ]}
        excludeHiddenFields={false}
        queryFragment={getFragment('UsersProfileEdit')}
        mutationFragment={getFragment('UsersProfileEdit')}
        // formComponents={{
        //   FormSubmit: () => <Button type="submit" variant="contained" color="primary" onClick={e => e.preventDefault()}>Save</Button>
        // }}
        successCallback={async (user) => {
          // flash(`User "${userGetDisplayName(user)}" edited`)
          // await client.resetStore()
          console.log('user', user)
          history.push(userGetProfileUrl(user))
        }}
      />
    </div>
  )
}


const EditProfileFormComponent = registerComponent('EditProfileForm', EditProfileForm, {styles});

declare global {
  interface ComponentTypes {
    EditProfileForm: typeof EditProfileFormComponent
  }
}
