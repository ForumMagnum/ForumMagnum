import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';

const InboxWrapper = () => {
  const currentUser = useCurrentUser();
  const { query } = useLocation();
  
  if (!currentUser) return <Components.Error404 />

  const showArchive = query.showArchive === "true"
  const terms: ConversationsViewTerms = {view: 'userConversations', userId: currentUser._id, showArchive};
  return <Components.InboxNavigation terms={terms} currentUser={currentUser}/>
}

const InboxWrapperComponent = registerComponent('InboxWrapper', InboxWrapper);

declare global {
  interface ComponentTypes {
    InboxWrapper: typeof InboxWrapperComponent
  }
}
