import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useEffect } from 'react';
import { STATES } from '../../lib/vulcan-accounts/helpers';
import { useLocation } from '../../lib/routeUtil'
import { Accounts } from '../../platform/current/lib/meteorAccounts';

const AccountsResetPassword = () => {
  const { params: { token } } = useLocation()
  const { WrappedLoginForm } = Components
  
  useEffect(() => {
    Accounts._loginButtonsSession.set('resetPasswordToken', token);
  }, [token])
  
  return <WrappedLoginForm formState={ STATES.PASSWORD_CHANGE }/>
}

// Shadows AccountsResetPassword from vulcan:accounts
const AccountsResetPasswordComponent = registerComponent('AccountsResetPassword', AccountsResetPassword);

declare global {
  interface ComponentTypes {
    AccountsResetPassword: typeof AccountsResetPasswordComponent
  }
}
