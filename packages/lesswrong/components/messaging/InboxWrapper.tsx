"use client";

import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';
import FriendlyInbox from "./FriendlyInbox";

export type InboxComponentProps = {
  currentUser: UsersCurrent;
  title?: React.JSX.Element | string;
  isModInbox?: boolean;
  showArchive?: boolean;
  view?: ConversationsViewName;
};

const InboxWrapper = () => {
  const currentUser = useCurrentUser();
  const { query } = useLocation();
  if (!currentUser) {
    return <div>Log in to access private messages.</div>
  }

  const conversationId = query.conversation;
  const showArchive = query.showArchive === "true";

  return <FriendlyInbox currentUser={currentUser} conversationId={conversationId} showArchive={showArchive} />
}

export default registerComponent('InboxWrapper', InboxWrapper);


