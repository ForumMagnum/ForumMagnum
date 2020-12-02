import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useEffect } from 'react';
import { STATES } from '../../lib/vulcan-accounts/helpers';
import { useLocation } from '../../lib/routeUtil'
import { useCurrentUser } from '../common/withUser';
import { Accounts } from '../../platform/current/lib/meteorAccounts';


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

const AccountsEnrollAccountComponent = registerComponent('AccountsEnrollAccount', AccountsEnrollAccount);

declare global {
  interface ComponentTypes {
    AccountsEnrollAccount: typeof AccountsEnrollAccountComponent
  }
}
