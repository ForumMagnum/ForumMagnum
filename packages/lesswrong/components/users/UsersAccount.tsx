import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import {isLWorAF} from '../../lib/instanceSettings.ts'

const UsersAccount = () => {
  const { params } = useLocation();
  const currentUser = useCurrentUser();
  
  if (!currentUser) {
    return <Components.SingleColumnSection>
      Log in to access account settings.
    </Components.SingleColumnSection>
  }
  
  // note: terms is as the same as a document-shape the SmartForm edit-mode expects to receive
  const terms: {slug?: string, documentId?: string} = params.slug ? { slug: params.slug } : { documentId: currentUser._id };
  return <div>
    <Components.UsersEditForm terms={terms} enableResetPassword={isLWorAF} />
  </div>
};

const UsersAccountComponent = registerComponent('UsersAccount', UsersAccount);

declare global {
  interface ComponentTypes {
    UsersAccount: typeof UsersAccountComponent
  }
}


