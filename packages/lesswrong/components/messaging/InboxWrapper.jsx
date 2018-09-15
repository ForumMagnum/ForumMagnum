/*

Wrapper for the Inbox components

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, withCurrentUser } from 'meteor/vulcan:core';
import defineComponent from '../../lib/defineComponent';

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

export default defineComponent({
  name: 'InboxWrapper',
  component: InboxWrapper,
  hocs: [ withCurrentUser ]
});
