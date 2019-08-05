import { Components, registerComponent } from 'vulcan:core';
import React from 'react';
import Users from 'vulcan:users';
import withUser from '../common/withUser';

const EmailConfirmationRequiredCheckbox = (props) => {
  let { currentUser, label, ...otherProps } = props;
  
  if(Users.emailAddressIsVerified(currentUser)) {
    return (
      <Components.FormComponentCheckbox
        {...props}
      />
    );
  } else {
    return (
      <Components.FormComponentCheckbox
        disabled
        {...otherProps}
        label={`${label} (verify your email address first)`}
      />
    );
  }
}

registerComponent("EmailConfirmationRequiredCheckbox", EmailConfirmationRequiredCheckbox, withUser);