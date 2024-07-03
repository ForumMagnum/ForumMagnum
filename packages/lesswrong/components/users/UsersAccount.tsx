import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import { userCanEditUser } from '@/lib/collections/users/helpers';

const UsersAccount = () => {
  const { params } = useLocation();
  const currentUser = useCurrentUser();

  const { ErrorAccessDenied } = Components;

  const terms = { slug: params.slug ?? currentUser?.slug };

  if(!terms.slug || !userCanEditUser(currentUser, terms)) {
    return <ErrorAccessDenied />;
  }

  return <div>
    <Components.UsersEditForm terms={terms} />
    <Components.UsersAccountManagement terms={terms} />
  </div>
};

const UsersAccountComponent = registerComponent('UsersAccount', UsersAccount);

declare global {
  interface ComponentTypes {
    UsersAccount: typeof UsersAccountComponent
  }
}


