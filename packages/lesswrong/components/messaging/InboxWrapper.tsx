"use client";

import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';
import FriendlyInbox from "./FriendlyInbox";
import { userIsAdmin } from '@/lib/vulcan-users/permissions';

export type InboxComponentProps = {
  currentUserId: string;
  title?: React.JSX.Element | string;
  isModInbox?: boolean;
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
  const isAdmin = userIsAdmin(currentUser);

  return <FriendlyInbox
    currentUserId={currentUser._id}
    conversationId={conversationId}
    showArchive={showArchive}
    isAdmin={isAdmin}
  />
}

export default InboxWrapper;


