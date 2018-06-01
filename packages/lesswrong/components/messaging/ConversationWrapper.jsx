/*

The Navigation for the Inbox components

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PageHeader from 'react-bootstrap/lib/PageHeader';
import { Components, registerComponent, withList, withCurrentUser, getFragment } from 'meteor/vulcan:core';
import Messages from "../../lib/collections/messages/collection.js";

class ConversationWrapper extends Component {

  renderMessages(results, currentUser) {
    if (results && results.length) {
      return (
        <div>
          {results.map((message) => (<Components.MessageItem key={message._id} currentUser={currentUser} message={message} />))}
        </div>);
    } else {
     return <div>There are no messages in  this conversation yet!</div>
    }
  }

  render() {

    const results = this.props.results;
    const currentUser = this.props.currentUser;
    const loading = this.props.loading;
    const conversation = this.props.conversation;

    if (loading) {
      return (<Components.Loading/>)
    } else if (conversation) {
      //TODO: Clean up the CSS for this component id:17
      return (
        <div>
          <PageHeader>
            {!!conversation.title ? conversation.title : _.pluck(conversation.participants, 'username').join(', ')}
            <br /> <small>{conversation.createdAt}</small>
          </PageHeader>
          {this.renderMessages(results, currentUser)}
          <div className="messages-smart-form">
            <Components.SmartForm
              collection={Messages}
              prefilledProps={ {conversationId: conversation._id} }
              mutationFragment={getFragment("messageListFragment")}
              errorCallback={(message) => {
                //eslint-disable-next-line no-console
                console.error("Failed to send", message)
              }}
            />
          </div>
        </div>
      )
    } else {
      return <div>No Conversation Selected</div>
    }
  }
}

const options = {
  collection: Messages,
  queryName: 'messagesForConversation',
  fragmentName: 'messageListFragment',
  limit: 1000,
  totalResolver: false,
};

registerComponent('ConversationWrapper', ConversationWrapper, [withList, options], withCurrentUser);
