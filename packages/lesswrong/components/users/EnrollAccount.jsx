import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { useEffect } from 'react';
import { STATES } from 'meteor/vulcan:accounts'
import { useLocation } from '../../lib/routeUtil'
import { useCurrentUser } from '../common/withUser';


const AccountsEnrollAccount = () => {
    const currentUser = useCurrentUser();
    const { params } = useLocation()
    useEffect(() => {
      Accounts._loginButtonsSession.set('enrollAccountToken', params.token);
    })

    if (!currentUser) {
      return (
        <Components.AccountsLoginForm
          formState={ STATES.ENROLL_ACCOUNT }
          currentUser={currentUser}
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

registerComponent('AccountsEnrollAccount', AccountsEnrollAccount);
