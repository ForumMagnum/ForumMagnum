/*

Button used to start a new conversation for a given user

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, withCurrentUser, withNew } from 'meteor/vulcan:core';
import {  withRouter } from 'react-router';
import Conversations from '../../lib/collections/conversations/collection.js';

class NewConversationButton extends Component {

  newConversation = () => {
    const { user, currentUser, newMutation, router } = this.props

    newMutation({
      collection: Conversations,
      document: {participantIds:[user._id, currentUser._id]},
      currentUser: currentUser,
      validate: false,
    }).then(response=>{
      router.push({pathname: '/inbox', query: {select: response.data.ConversationsNew._id}})
    })
  }

  render() {
    const { currentUser, buttonComponent, children } = this.props;

    if (currentUser) {
      return (
        <div className="new-conversation-button" onClick={this.newConversation}>
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
  buttonComponent: PropTypes.element.isRequired,
  currentUser: PropTypes.object,
};

const withNewOptions = {
  collection: Conversations,
  fragmentName: 'newConversationFragment',
}

registerComponent('NewConversationButton', NewConversationButton, [withNew, withNewOptions], withCurrentUser, withRouter);
