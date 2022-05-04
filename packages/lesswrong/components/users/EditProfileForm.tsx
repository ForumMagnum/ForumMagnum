
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { userCanEdit, userGetDisplayName, userGetProfileUrl } from '../../lib/collections/users/helpers';
import Button from '@material-ui/core/Button';
import { useCurrentUser } from '../common/withUser';
import { useNavigation } from '../../lib/routeUtil';
import { gql, useMutation, useApolloClient } from '@apollo/client';
import { forumTypeSetting } from '../../lib/instanceSettings';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import Users from '../../lib/vulcan-users';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 800,
    margin: '0 auto'
  },
  formControl: {
    display: 'block'
  },
})

const EditProfileForm = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  
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
        fields={['linkedInProfileURL']}
        excludeHiddenFields={false}
        queryFragment={getFragment('UsersProfileEdit')}
        mutationFragment={getFragment('UsersProfileEdit')}
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
