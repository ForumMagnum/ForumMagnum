/*

Wrapper for the Inbox components

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, withCurrentUser } from 'meteor/vulcan:core';
import defineComponent from '../../lib/defineComponent';
import InboxNavigation from './InboxNavigation'

class InboxWrapper extends Component {
  render () {
    const terms = {view: 'userConversations', userId: (!!this.props.currentUser ? this.props.currentUser._id : "0")};
    return(
      <div className="wrapper">
          {!!this.props.currentUser ? <InboxNavigation terms={terms}/> : <div></div>}
      </div>
    )
  }
}

export default defineComponent({
  name: 'InboxWrapper',
  component: InboxWrapper,
  register: false,
  hocs: [ withCurrentUser ]
});
