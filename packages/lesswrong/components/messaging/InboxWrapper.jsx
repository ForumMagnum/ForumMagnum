import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import withUser from '../common/withUser';

const InboxWrapper = ({currentUser}) => {
  if (!currentUser) {
    return <div>Log in to access private messages.</div>
  }
  
  const terms = {view: 'userConversations', userId: currentUser._id};
  return <div>
    <Components.InboxNavigation terms={terms}/>
  </div>
}

registerComponent('InboxWrapper', InboxWrapper, withUser);
