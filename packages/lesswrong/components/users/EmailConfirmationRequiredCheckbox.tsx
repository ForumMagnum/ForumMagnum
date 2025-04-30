import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { userEmailAddressIsVerified } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import { TanStackCheckbox, TanStackCheckboxProps } from '@/components/tanstack-form-components/TanStackCheckbox';

export const EmailConfirmationRequiredCheckbox = (props: TanStackCheckboxProps) => {
  const currentUser = useCurrentUser();
  let { label, ...otherProps } = props;
  
  if(userEmailAddressIsVerified(currentUser)) {
    return (
      <TanStackCheckbox
        {...props}
      />
    );
  } else {
    return (
      <TanStackCheckbox
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
