import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';
import { userCanDo } from '../../lib/vulcan-users';
import { Link } from '../../lib/reactRouterWrapper';
import { isEAForum } from '../../lib/instanceSettings';

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

  // TODO change to isFriendlyUI when https://github.com/ForumMagnum/ForumMagnum/pull/7908 is merged
  const InboxComponent = isEAForum ? FriendlyInbox : InboxNavigation;
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
