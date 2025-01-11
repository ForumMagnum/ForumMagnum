import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';
import { isFriendlyUI } from '../../themes/forumTheme';

export type InboxComponentProps = {
  terms: ConversationsViewTerms;
  currentUser: UsersCurrent;
  title?: JSX.Element | String;
  isModInbox?: boolean;
};

const InboxWrapper = () => {
  const currentUser = useCurrentUser();
  const { query, params } = useLocation();

  const { InboxNavigation, FriendlyInbox } = Components

  if (!currentUser) {
    return <div>Log in to access private messages.</div>
  }

  const conversationId = params._id;

  const showArchive = query.showArchive === "true"
  const terms: ConversationsViewTerms = {
    view: "userConversations",
    userId: currentUser._id,
    showArchive,
  };

  if (conversationId) {
    return <FriendlyInbox terms={terms} currentUser={currentUser} conversationId={conversationId} />
  }

  const InboxComponent = isFriendlyUI ? FriendlyInbox : InboxNavigation;
  return <InboxComponent terms={terms} currentUser={currentUser}/>
}

const InboxWrapperComponent = registerComponent('InboxWrapper', InboxWrapper);

declare global {
  interface ComponentTypes {
    InboxWrapper: typeof InboxWrapperComponent
  }
}
