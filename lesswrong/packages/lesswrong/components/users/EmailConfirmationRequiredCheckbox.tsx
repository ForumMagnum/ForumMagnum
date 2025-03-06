import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { userEmailAddressIsVerified } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import FormComponentCheckbox from "@/components/form-components/FormComponentCheckbox";

const EmailConfirmationRequiredCheckbox = (props: any) => {
  const currentUser = useCurrentUser();
  let { label, ...otherProps } = props;
  
  if(userEmailAddressIsVerified(currentUser)) {
    return (
      <FormComponentCheckbox
        {...props}
      />
    );
  } else {
    return (
      <FormComponentCheckbox
        disabled
        {...otherProps}
        label={`${label} (verify your email address first)`}
      />
    );
  }
}

const EmailConfirmationRequiredCheckboxComponent = registerComponent("EmailConfirmationRequiredCheckbox", EmailConfirmationRequiredCheckbox);

declare global {
  interface ComponentTypes {
    EmailConfirmationRequiredCheckbox: typeof EmailConfirmationRequiredCheckboxComponent
  }
}

export default EmailConfirmationRequiredCheckboxComponent;
