import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withRouter } from '../../lib/reactRouterWrapper.js';
import withUser from '../common/withUser';

const InboxWrapper = ({currentUser, location}) => {
  if (!currentUser) {
    return <div>Log in to access private messages.</div>
  }
  const showArchive = location?.query?.showArchive === "true"
  const terms = {view: 'userConversations', userId: currentUser._id, showArchive};
  return <div>
    <Components.InboxNavigation terms={terms}/>
  </div>
}

registerComponent('InboxWrapper', InboxWrapper, withUser, withRouter);
