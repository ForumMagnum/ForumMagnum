import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { isFriendlyUI } from '../../themes/forumTheme';
import InboxNavigation from "./InboxNavigation";
import FriendlyInbox from "./FriendlyInbox";

const ModeratorInboxWrapper = () => {
  const currentUser = useCurrentUser();
  const { query, params } = useLocation();
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

export default registerComponent('ModeratorInboxWrapper', ModeratorInboxWrapper);


