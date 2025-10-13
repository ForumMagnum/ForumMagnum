"use client";

import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';
import FriendlyInbox from "./FriendlyInbox";

export type InboxComponentProps = {
  terms: ConversationsViewTerms;
  currentUser: UsersCurrent;
  title?: React.JSX.Element | string;
  isModInbox?: boolean;
};

const InboxWrapper = () => {
  const currentUser = useCurrentUser();
  const { query } = useLocation();
  if (!currentUser) {
    return <div>Log in to access private messages.</div>
  }

  const conversationId = query.conversation;
  const showArchive = query.showArchive === "true";

  const terms: ConversationsViewTerms = {
    view: "userConversations",
    userId: currentUser._id,
    showArchive,
  };

  return <FriendlyInbox terms={terms} currentUser={currentUser} conversationId={conversationId} />
}

export default registerComponent('InboxWrapper', InboxWrapper);


