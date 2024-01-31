import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { isFriendlyUI } from '../../themes/forumTheme';

const ModeratorInboxWrapper = () => {
  const currentUser = useCurrentUser();
  const { query, params } = useLocation();

  const { InboxNavigation, FriendlyInbox } = Components

  if (!currentUser) {
    return <div>Log in to access private messages.</div>
  }

  const conversationId = params._id;

  const showArchive = query.showArchive === "true"
  const terms: ConversationsViewTerms = { view: "moderatorConversations", showArchive, userId: query.userId };

  if (conversationId) {
    return <FriendlyInbox terms={terms} currentUser={currentUser} conversationId={conversationId} isModInbox />;
  }

  const InboxComponent = isFriendlyUI ? FriendlyInbox : InboxNavigation;
  return (
    <InboxComponent
      terms={terms}
      currentUser={currentUser}
      title={<Link to="/moderatorInbox">Moderator Conversations</Link>}
      isModInbox
    />
  );
}

const ModeratorInboxWrapperComponent = registerComponent('ModeratorInboxWrapper', ModeratorInboxWrapper);

declare global {
  interface ComponentTypes {
    ModeratorInboxWrapper: typeof ModeratorInboxWrapperComponent
  }
}
