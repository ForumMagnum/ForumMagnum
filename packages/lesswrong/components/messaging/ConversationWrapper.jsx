/*

The Navigation for the Inbox components

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, withList, withCurrentUser, getFragment } from 'meteor/vulcan:core';
import Messages from "../../lib/collections/messages/collection.js";
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  headline: {
    ...theme.typography.commentStyle,
    marginTop: theme.spacing.unit,
    marginLeft: 2,
    marginBottom: theme.spacing.unit*1.5
  },
  editor: {
    marginTop: theme.spacing.unit*4,
    ...theme.typography.commentStyle,
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
     return <div>There are no messages in  this conversation yet!</div>
    }
  }

  render() {

    const { results, currentUser, loading, conversation, classes } = this.props

    if (loading) {
      return (<Components.Loading/>)
    } else if (conversation) {
      //TODO: Clean up the CSS for this component id:17
      return (
        <div className={classes.root}>
          <Typography variant="display2" className={classes.headline}>
            {!!conversation.title ? conversation.title : _.pluck(conversation.participants, 'username').join(', ')}
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

registerComponent('ConversationWrapper', ConversationWrapper, [withList, options], withCurrentUser, withStyles(styles));
