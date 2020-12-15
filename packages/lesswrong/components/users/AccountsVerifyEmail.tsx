import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import { withApollo } from '@apollo/client/react/hoc';
import { userEmailAddressIsVerified } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    textAlign: "center",
  }
});

const AccountsVerifyEmail = ({classes, client}: {
  classes: ClassesType,
  client?: any,
}) => {
  const currentUser = useCurrentUser();
  const { params } = useLocation()
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  if (success) {
    return <div className={classes.root}>
      Your email address has been verified.
    </div>
  }

  if(error) {
    if (userEmailAddressIsVerified(currentUser)) {
      return (
        <div className={classes.root}>
          Your email address is already verified.
        </div>
      );
    } else {
      return (
        <div className={classes.root}>
          {error}
        </div>
      );
    }
  } 
  return (
    <div className={classes.root}>
      <Components.Loading />
    </div>
  );
}

// Shadows AccountsVerifyEmail in meteor/vulcan:accounts
const AccountsVerifyEmailComponent = registerComponent('AccountsVerifyEmail', AccountsVerifyEmail, {
  styles,
  hocs: [withApollo],
});

declare global {
  interface ComponentTypes {
    AccountsVerifyEmail: typeof AccountsVerifyEmailComponent,
  }
}


