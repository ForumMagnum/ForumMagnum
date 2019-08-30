/*

The Navigation for the Inbox components

*/

import React, { Component } from 'react';
import { Components, registerComponent, withList, withDocument, getFragment } from 'meteor/vulcan:core';
import Messages from "../../lib/collections/messages/collection.js";
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import Conversations from '../../lib/collections/conversations/collection.js';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';
import { Link } from '../../lib/reactRouterWrapper.js';

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
  },
  backButton: {
    color: theme.palette.lwTertiary.main
  }
})

class ConversationPage extends Component {

  renderMessages = () => {
    const { results, currentUser, loading } = this.props
    const { Loading, MessageItem } = Components
    if (loading) return <Loading />
    if (!results?.length) return null
    
    return <div>
      {results.map((message) => (<MessageItem key={message._id} currentUser={currentUser} message={message} />))}
    </div>
  }

  render() {
    const { results, currentUser, document:conversation, classes, loading } = this.props
    const { SingleColumnSection, ConversationDetails, WrappedSmartForm, Error404, Loading } = Components
    if (loading) return <Loading />
    if (!conversation) return <Error404 />

    return (
      <SingleColumnSection>
        <Typography variant="body1" className={classes.backButton}><Link to="/inbox"> Go back to Inbox </Link></Typography>
        <Typography variant="h3" className={classes.conversationTitle}>
          { Conversations.getTitle(conversation, currentUser)}
        </Typography>
        <ConversationDetails conversation={conversation}/>
        {this.renderMessages(results, currentUser)}
        <div className={classes.editor}>
          <WrappedSmartForm
            collection={Messages}
            prefilledProps={ {conversationId: conversation._id} }
            mutationFragment={getFragment("messageListFragment")}
            errorCallback={(message) => {
              //eslint-disable-next-line no-console
              console.error("Failed to send", message)
            }}
          />
        </div>
      </SingleColumnSection>
    )
  }
}

const withDocumentOptions = {
  collection: Conversations,
  queryName: 'ConversationSingle',
  fragmentName: 'conversationsListFragment',
};

const options = {
  collection: Messages,
  queryName: 'messagesForConversation',
  fragmentName: 'messageListFragment',
  fetchPolicy: 'cache-and-network',
  limit: 1000,
  enableTotal: false,
};

registerComponent('ConversationPage', ConversationPage, withErrorBoundary,
  [withList, options],  withUser, [withDocument, withDocumentOptions], 
  withStyles(styles, { name: "ConversationPage" }));
