import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';

const InboxWrapper = () => {
  const currentUser = useCurrentUser();
  const { query } = useLocation();
  
  if (!currentUser) {
    return <div>Log in to access private messages.</div>
  }
  const showArchive = query.showArchive === "true"
  const terms = {view: 'userConversations', userId: currentUser._id, showArchive};
  return <div>
    <Components.InboxNavigation terms={terms}/>
  </div>
}

registerComponent('InboxWrapper', InboxWrapper);
