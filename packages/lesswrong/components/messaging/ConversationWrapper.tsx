import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';

const ConversationWrapper = () => {
  const currentUser = useCurrentUser()
  const { params } = useLocation();
  
  if (!currentUser) return <div>Log in to access private messages.</div>
  const messagesTerms: MessagesViewTerms = {view: 'messagesConversation', conversationId: params._id};

  return <Components.ConversationPage terms={messagesTerms} documentId={params._id} currentUser={currentUser} />
}

const ConversationWrapperComponent = registerComponent('ConversationWrapper', ConversationWrapper);

declare global {
  interface ComponentTypes {
    ConversationWrapper: typeof ConversationWrapperComponent
  }
}

