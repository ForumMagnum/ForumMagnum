import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { useEffect } from 'react';
import { STATES } from 'meteor/vulcan:accounts'
import { useLocation } from '../../lib/routeUtil'

const AccountsResetPassword = () => {
  const { params: { token } } = useLocation()
  const { WrappedLoginForm } = Components
  
  useEffect(() => {
    Accounts._loginButtonsSession.set('resetPasswordToken', token);
  }, [token])
  
  return <WrappedLoginForm formState={ STATES.PASSWORD_CHANGE }/>
}

// Shadows AccountsResetPassword from vulcan:accounts
registerComponent('AccountsResetPassword', AccountsResetPassword);
