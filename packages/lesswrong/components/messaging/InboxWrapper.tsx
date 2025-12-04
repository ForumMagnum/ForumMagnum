"use client";

import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';
import FriendlyInbox from "./FriendlyInbox";
import { userCanDo, userIsAdmin } from '@/lib/vulcan-users/permissions';

export type InboxComponentProps = {
  currentUserId: string;
  title?: React.JSX.Element | string;
  isModInbox?: boolean;
  userCanViewModInbox?: boolean;
  isAdmin?: boolean;
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
  const userCanViewModInbox = userCanDo(currentUser, 'conversations.view.all');
  const isAdmin = userIsAdmin(currentUser);

  return <FriendlyInbox
    currentUserId={currentUser._id}
    conversationId={conversationId}
    showArchive={showArchive}
    userCanViewModInbox={userCanViewModInbox}
    isAdmin={isAdmin}
  />
}

export default registerComponent('InboxWrapper', InboxWrapper);


