/*

Button used to start a new conversation for a given user

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, withCreate, getSetting } from 'meteor/vulcan:core';
import { withNavigation } from '../../lib/routeUtil.js';
import Conversations from '../../lib/collections/conversations/collection.js';
import withUser from '../common/withUser';

class NewConversationButton extends Component {

  newConversation = async () => {
    const { user, currentUser, createConversation, history } = this.props
    const alignmentFields = getSetting('forumType') === 'AlignmentForum' ? {af: true} : {}

    const response = await createConversation({
      data: {participantIds:[user._id, currentUser._id], ...alignmentFields},
    })
    const conversationId = response.data.createConversation.data._id
    history.push({pathname: `/inbox/${conversationId}`})
  }

  render() {
    const { currentUser, children } = this.props;

    if (currentUser) {
      return (
        <div onClick={this.newConversation}>
          {children}
        </div>
      )
    } else {
      return <Components.Loading />
    }
  }
}

NewConversationButton.propTypes = {
  user: PropTypes.object.isRequired,
  currentUser: PropTypes.object,
};

const withCreateOptions = {
  collection: Conversations,
  fragmentName: 'newConversationFragment',
}

registerComponent('NewConversationButton', NewConversationButton, [withCreate, withCreateOptions], withUser, withNavigation);
