import { Components, registerComponent, withCurrentUser } from 'meteor/vulcan:core';
import React, { useEffect } from 'react';
import { STATES } from 'meteor/vulcan:accounts'
import { useLocation } from '../../lib/routeUtil'


const AccountsEnrollAccount = ({currentUser}) => {
    const { params } = useLocation()
    useEffect(() => {
      Accounts._loginButtonsSession.set('enrollAccountToken', params.token);
    })

    if (!currentUser) {
      return (
        <Components.AccountsLoginForm
          formState={ STATES.ENROLL_ACCOUNT }
        />
      );
    } else {
      return (
        <div className='password-reset-form'>
          <div>Password changed</div>
        </div>
      );
    }
}

registerComponent('AccountsEnrollAccount', AccountsEnrollAccount, withCurrentUser);
