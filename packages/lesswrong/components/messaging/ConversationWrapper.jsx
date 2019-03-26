/*

The Navigation for the Inbox components

*/

import React, { Component } from 'react';
import { Components, registerComponent, withList, getFragment } from 'meteor/vulcan:core';
import Messages from "../../lib/collections/messages/collection.js";
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import Conversations from '../../lib/collections/conversations/collection.js';
import withUser from '../common/withUser';

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

  renderMessages = () => {
    const { results, currentUser, loading } = this.props
    if (results && results.length) {
      return (
        <div>
          {results.map((message) => (<Components.MessageItem key={message._id} currentUser={currentUser} message={message} />))}
        </div>);
    } else if (loading) {
      return <Components.Loading/>
    } else {
      return null
    }
  }

  render() {

    const { results, currentUser, conversation, classes } = this.props

    if (conversation) {
      return (
        <Components.ErrorBoundary>
          <Typography variant="display2" className={classes.conversationTitle}>
            { Conversations.getTitle(conversation, currentUser)}
          </Typography>
          <Components.ConversationDetails conversation={conversation}/>
          {this.renderMessages(results, currentUser)}
          <div className={classes.editor}>
            <Components.WrappedSmartForm
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
        </Components.ErrorBoundary>
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
  enableTotal: false,
};

registerComponent('ConversationWrapper', ConversationWrapper, [withList, options], withUser, withStyles(styles, { name: "ConversationWrapper" }));
