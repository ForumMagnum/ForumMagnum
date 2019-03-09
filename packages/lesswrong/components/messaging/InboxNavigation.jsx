/*

The Navigation for the Inbox components

*/

import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import Conversations from '../../lib/collections/conversations/collection.js';
import Typography from '@material-ui/core/Typography';
import { Link } from 'react-router';
import grey from '@material-ui/core/colors/grey';
import withUser from '../common/withUser';

import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    fontFamily: theme.typography.commentStyle
  },
  conversation: {
    maxWidth:500
  },
  conversationItem: {
    color: grey[600],
    cursor: "pointer",
    padding: theme.spacing.unit,
    display: "flex",
    justifyContent: "flex-end",
    '&:hover': {
      color: grey[400]
    },
    [theme.breakpoints.down('sm')]: {
      justifyContent: "flex-start",
    },
  },
  conversationItemLatestActivity: {
    marginLeft: theme.spacing.unit
  },
  navigation: {
    marginTop: theme.spacing.unit*2,
    [theme.breakpoints.down('sm')]: {
      maxHeight: 100,
      overflowX: "auto",
      overflowY: "scroll",
    },
  }
})

class InboxNavigation extends Component {

  render() {
    const { results, classes, currentUser } = this.props
    const select = this.props.location.query.select;

    const messagesTerms = {view: 'messagesConversation', conversationId: select};

    if(currentUser && results) {
      let conversation = results.length && results.find(c => (c._id == select));

      return (
        <Components.Section
          title="Conversations"
          titleComponent={this.renderNavigation()}
          >
            <div className={classes.conversation}>
              <Components.ConversationWrapper terms={messagesTerms} conversation={conversation} />
            </div>
        </Components.Section>
      )
    } else {
      return <div></div>
    }
  }

  renderNavigation = () => {
    const { results, classes, currentUser } = this.props;

    //TODO: Add ability to add conversation from Inbox page, by searching for a user id:15

    if(results && results.length){
      return (
        <div className={classes.navigation}>
          {results.map(conversation =>
            <Link key={conversation._id} to={{pathname: "/inbox", query: {select: conversation._id}}}>
                <Typography variant="body2" className={classes.conversationItem}>
                  { Conversations.getTitle(conversation, currentUser) }
                  <span className={classes.conversationItemLatestActivity}>
                    {conversation.latestActivity && <Components.FormatDate date={conversation.latestActivity}/>}
                  </span>
                </Typography>
            </Link>)
          }
        </div>
      );
    } else {
      return this.props.loading ? <div>Loading...</div> : null;
    }
  }

}

const conversationOptions = {
  collection: Conversations,
  queryName: 'conversationsListQuery',
  fragmentName: 'conversationsListFragment',
  limit: 20,
  enableTotal: false,
};

registerComponent('InboxNavigation', InboxNavigation, [withList, conversationOptions], withUser, withRouter, withStyles(styles, { name: "InboxNavigation" }));
