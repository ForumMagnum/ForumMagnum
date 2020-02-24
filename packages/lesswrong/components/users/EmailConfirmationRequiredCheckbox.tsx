import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import Users from '../../lib/collections/users/collection';
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

const EmailConfirmationRequiredCheckboxComponent = registerComponent("EmailConfirmationRequiredCheckbox", EmailConfirmationRequiredCheckbox, {
  hocs: [withUser]
});

declare global {
  interface ComponentTypes {
    EmailConfirmationRequiredCheckbox: typeof EmailConfirmationRequiredCheckboxComponent
  }
}
