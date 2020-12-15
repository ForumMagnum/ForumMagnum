import { registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useLocation } from '../../lib/routeUtil'

const AccountsResetPassword = () => {
  const { params: { token } } = useLocation()
  
  return <div>
    This will be a password reset form
  </div>
}

// Shadows AccountsResetPassword from vulcan:accounts
const AccountsResetPasswordComponent = registerComponent('AccountsResetPassword', AccountsResetPassword);

declare global {
  interface ComponentTypes {
    AccountsResetPassword: typeof AccountsResetPasswordComponent
  }
}
