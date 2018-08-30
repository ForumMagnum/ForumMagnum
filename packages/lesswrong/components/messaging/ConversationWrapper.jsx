/*

The Navigation for the Inbox components

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, withList, withCurrentUser, getFragment } from 'meteor/vulcan:core';
import Messages from "../../lib/collections/messages/collection.js";
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import Conversations from '../../lib/collections/conversations/collection.js';

const styles = theme => ({
  conversationTitle: {
    ...theme.typography.commentStyle,
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit*1.5
  },
  editor: {
    marginTop: theme.spacing.unit*4,
    ...theme.typography.commentStyle,
    position:"relative",
  }
})

class ConversationWrapper extends Component {

  renderMessages(results, currentUser) {
    if (results && results.length) {
      return (
        <div>
          {results.map((message) => (<Components.MessageItem key={message._id} currentUser={currentUser} message={message} />))}
        </div>);
    } else {
     return <Components.NoContent>There are no messages in this conversation yet!</Components.NoContent>
    }
  }

  render() {

    const { results, currentUser, loading, conversation, classes } = this.props

    if (loading) {
      return (<Components.Loading/>)
    } else if (conversation) {
      return (
        <div>
          <Typography variant="display2" className={classes.conversationTitle}>
            { Conversations.getTitle(conversation, currentUser)}
          </Typography>
          <Components.ConversationDetails conversation={conversation}/>
          {this.renderMessages(results, currentUser)}
          <div className={classes.editor}>
            <Components.SmartForm
              key={conversation._id}
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
      return <Components.NoContent>No Conversation Selected</Components.NoContent>
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

registerComponent('ConversationWrapper', ConversationWrapper, [withList, options], withCurrentUser, withStyles(styles));
