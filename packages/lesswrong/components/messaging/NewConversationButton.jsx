/*

Button used to start a new conversation for a given user

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, withNew, getSetting } from 'meteor/vulcan:core';
import {  withRouter } from 'react-router';
import Conversations from '../../lib/collections/conversations/collection.js';
import withUser from '../common/withUser';

class NewConversationButton extends Component {

   newConversation = async () => {
    const { user, currentUser, newMutation, router } = this.props
    const alignmentFields = getSetting('AlignmentForum', false) ? {af: true} : {}

    const response = await newMutation({
      collection: Conversations,
      document: {participantIds:[user._id, currentUser._id], ...alignmentFields},
      currentUser: currentUser,
      validate: false,
    })
    router.push({pathname: '/inbox', query: {select: response.data.createConversation.data._id}})
  }

  render() {
    const { currentUser, children } = this.props;

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
  currentUser: PropTypes.object,
};

const withNewOptions = {
  collection: Conversations,
  fragmentName: 'newConversationFragment',
}

registerComponent('NewConversationButton', NewConversationButton, [withNew, withNewOptions], withUser, withRouter);
