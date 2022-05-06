
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import Users from '../../lib/vulcan-users';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { useNavigation } from '../../lib/routeUtil';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 800,
    margin: '0 auto'
  },
  heading: {
    marginTop: 0,
    [theme.breakpoints.down('sm')]: {
      marginTop: 30
    }
  },
  subheading: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.grey[700],
    marginBottom: 40
  }
})

const EditProfileForm = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
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
      <Typography variant="display3" className={classes.heading} gutterBottom>Edit Public Profile</Typography>
      <div className={classes.subheading}>All fields are optional</div>
      
      <WrappedSmartForm
        collection={Users}
        documentId={currentUser._id}
        fields={[
          'jobTitle',
          'organization',
          'bio',
          'mapLocation',
          'website',
          'linkedinProfileURL',
          'facebookProfileURL',
          'twitterProfileURL',
          'githubProfileURL',
        ]}
        excludeHiddenFields={false}
        queryFragment={getFragment('UsersProfileEdit')}
        mutationFragment={getFragment('UsersProfileEdit')}
        successCallback={async (user) => {
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
