import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { userEmailAddressIsVerified } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import type { FormComponentCheckboxProps } from '@/components/form-components/FormComponentCheckbox';
import FormComponentCheckbox from "../form-components/FormComponentCheckbox";

const EmailConfirmationRequiredCheckbox = (props: FormComponentCheckboxProps) => {
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

export default registerComponent("EmailConfirmationRequiredCheckbox", EmailConfirmationRequiredCheckbox);


