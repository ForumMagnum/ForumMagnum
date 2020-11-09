import { registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useLocation } from '../../lib/routeUtil'
import { useCurrentUser } from '../common/withUser';


const AccountsEnrollAccount = () => {
    const currentUser = useCurrentUser();
    const { params } = useLocation()

    return <div>
      This will be an account enrollment form
    </div>
}

const AccountsEnrollAccountComponent = registerComponent('AccountsEnrollAccount', AccountsEnrollAccount);

declare global {
  interface ComponentTypes {
    AccountsEnrollAccount: typeof AccountsEnrollAccountComponent
  }
}
