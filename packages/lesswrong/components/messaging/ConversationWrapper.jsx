/*

The Navigation for the Inbox components

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, withList, getFragment } from 'meteor/vulcan:core';
import Messages from "../../lib/collections/messages/collection.js";
import Typography from '@material-ui/core/Typography';
import Conversations from '../../lib/collections/conversations/collection.js';
import defineComponent from '../../lib/defineComponent';
import withUser from '../common/withUser';

import ConversationDetails from './ConversationDetails';
import MessageItem from './MessageItem';

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
          {results.map((message) => (<MessageItem key={message._id} currentUser={currentUser} message={message} />))}
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
        <div>
          <Typography variant="display2" className={classes.conversationTitle}>
            { Conversations.getTitle(conversation, currentUser)}
          </Typography>
          <ConversationDetails conversation={conversation}/>
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

export default defineComponent({
  name: 'ConversationWrapper',
  component: ConversationWrapper,
  styles: styles,
  register: false,
  hocs: [ [withList, options], withUser ]
});
