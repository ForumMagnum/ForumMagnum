"use client";

import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';
import { isFriendlyUI } from '../../themes/forumTheme';
import InboxNavigation from "./InboxNavigation";
import FriendlyInbox from "./FriendlyInbox";

export type InboxComponentProps = {
  terms: ConversationsViewTerms;
  currentUser: UsersCurrent;
  title?: React.JSX.Element | string;
  isModInbox?: boolean;
};

const InboxWrapper = () => {
  const currentUser = useCurrentUser();
  const { query, params } = useLocation();
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

  const InboxComponent = isFriendlyUI() ? FriendlyInbox : InboxNavigation;
  return <InboxComponent terms={terms} currentUser={currentUser}/>
}

export default registerComponent('InboxWrapper', InboxWrapper);


