import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';

/**
 * A page with a private mesage conversation, with URL parameter parsing.
 */
const ConversationWrapper = () => {
  const currentUser = useCurrentUser()
  const { params } = useLocation();
  
  if (!currentUser) return <div>Log in to access private messages.</div>

  return <Components.ConversationPage conversationId={params._id} currentUser={currentUser} />
}

const ConversationWrapperComponent = registerComponent('ConversationWrapper', ConversationWrapper);

declare global {
  interface ComponentTypes {
    ConversationWrapper: typeof ConversationWrapperComponent
  }
}

