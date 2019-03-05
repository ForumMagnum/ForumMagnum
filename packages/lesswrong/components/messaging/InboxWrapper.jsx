/*

Wrapper for the Inbox components

*/

import React, { Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import withUser from '../common/withUser';

class InboxWrapper extends Component {
  render () {
    const terms = {view: 'userConversations', userId: (!!this.props.currentUser ? this.props.currentUser._id : "0")};
    return(
      <div className="wrapper">
          {!!this.props.currentUser ? <Components.InboxNavigation terms={terms}/> : <div></div>}
      </div>
    )
  }
}

registerComponent('InboxWrapper', InboxWrapper, withUser);
