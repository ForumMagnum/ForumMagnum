import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';

const ModeratorInboxWrapper = () => {
  const currentUser = useCurrentUser();
  const { query } = useLocation();
  
  if (!currentUser) {
    return <div>Log in to access private messages.</div>
  }
  const showArchive = query.showArchive === "true"
  const terms: ConversationsViewTerms = {view: 'moderatorConversations', userId: currentUser._id, showArchive};
  return <div>
    <Components.InboxNavigation terms={terms} currentUser={currentUser} title="Moderator Conversations"/>
  </div>
}

const ModeratorInboxWrapperComponent = registerComponent('ModeratorInboxWrapper', ModeratorInboxWrapper);

declare global {
  interface ComponentTypes {
    ModeratorInboxWrapper: typeof ModeratorInboxWrapperComponent
  }
}
