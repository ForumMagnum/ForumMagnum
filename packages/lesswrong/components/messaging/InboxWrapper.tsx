import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';
import { isEAForum } from '../../lib/instanceSettings';

export type InboxComponentProps = {
  terms: ConversationsViewTerms;
  currentUser: UsersCurrent;
  title?: JSX.Element | String;
  classes: ClassesType;
};

const InboxWrapper = () => {
  const currentUser = useCurrentUser();
  const { query, params } = useLocation();

  const { InboxNavigation, AllMessagesPage, ConversationPage } = Components

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
    return <AllMessagesPage terms={terms} currentUser={currentUser} conversationId={conversationId} />
  }

  // TODO change to isFriendlyUI when https://github.com/ForumMagnum/ForumMagnum/pull/7908 is merged
  const InboxComponent = isEAForum ? AllMessagesPage : InboxNavigation;
  return <InboxComponent terms={terms} currentUser={currentUser}/>
}

const InboxWrapperComponent = registerComponent('InboxWrapper', InboxWrapper);

declare global {
  interface ComponentTypes {
    InboxWrapper: typeof InboxWrapperComponent
  }
}
