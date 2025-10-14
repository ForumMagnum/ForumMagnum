"use client";

import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';
import FriendlyInbox from "./FriendlyInbox";

const ModeratorInboxWrapper = () => {
  const currentUser = useCurrentUser();
  const { query } = useLocation();
  if (!currentUser) {
    return <div>Log in to access private messages.</div>
  }

  const conversationId = query.conversation;
  const showArchive = query.showArchive === "true";

  return (
    <FriendlyInbox
      currentUser={currentUser}
      conversationId={conversationId}
      isModInbox
      showArchive={showArchive}
    />
  )
}

export default ModeratorInboxWrapper;


