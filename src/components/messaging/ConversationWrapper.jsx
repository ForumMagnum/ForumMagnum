import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import withUser from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';

const ConversationWrapper = ({currentUser}) => {
  const { params } = useLocation();
  
  if (!currentUser) return <div>Log in to access private messages.</div>
  const messagesTerms = {view: 'messagesConversation', conversationId: params._id};

  return <Components.ConversationPage terms={messagesTerms} documentId={params._id}/>
}

registerComponent('ConversationWrapper', ConversationWrapper, withUser);
