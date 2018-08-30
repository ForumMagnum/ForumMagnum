/*

The Navigation for the Inbox components

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { Components, registerComponent, withList, withCurrentUser } from 'meteor/vulcan:core';
import moment from 'moment';
import Conversations from '../../lib/collections/conversations/collection.js';
import Typography from '@material-ui/core/Typography';
import { Link } from 'react-router';
import grey from '@material-ui/core/colors/grey';

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
    borderBottom: `solid 1px`,
    borderBottomColor: grey[200],
    padding: theme.spacing.unit,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    textAlign: "left",
    '&:hover': {
      backgroundColor: grey[100]
    }
  },
  conversationItemLatestActivity: {
    marginLeft: theme.spacing.unit
  },
  navigation: {
    marginTop: theme.spacing.unit*2
  }
})

class InboxNavigation extends Component {

  render() {
    const { results, classes, currentUser } = this.props
    const select = this.props.location.query.select;

    const messagesTerms = {view: 'messagesConversation', conversationId: select};

    if(currentUser && results) {
      let conversation = results.length && results.find(c => (c._id == select));
      let notificationsSelect = (select == "Notifications");

      let thereAreNone = notificationsSelect ? <p>You have no notifications.</p> : <p>There are no messages in this conversation.</p>
      let notificationsWrapper = results.length ? <Components.NotificationsWrapper/> : thereAreNone

      return (
        <Components.Section
          title="Conversations"
          titleComponent={this.renderNavigation()}
          >
            <div className={classes.conversation}>
                {notificationsSelect ? notificationsWrapper : <Components.ConversationWrapper terms={messagesTerms} conversation={conversation} />}
            </div>
        </Components.Section>
      )
    } else {
      return <div></div>
    }
  }

  getConversationTitle = (conversation) => {
    if (!!conversation.title) {
      return conversation.title
    } else {
      return _.pluck(conversation.participants, 'username').join(' - ')
    }
  }

  renderNavigation = () => {
    const { results, classes } = this.props;

    //TODO: Add ability to add conversation from Inbox page, by searching for a user id:15

    if(results && results.length){
      return (
        <div className={classes.navigation}>
          {results.map(conversation =>
            <Link key={conversation._id} to={{pathname: "/inbox", query: {select: conversation._id}}}>
                <Typography variant="body2" className={classes.conversationItem}>
                  { this.getConversationTitle(conversation) }
                  <span className={classes.conversationItemLatestActivity}>
                    {conversation.latestActivity && moment(new Date(conversation.latestActivity)).fromNow()}
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
  totalResolver: false,
};

registerComponent('InboxNavigation', InboxNavigation, [withList, conversationOptions], withCurrentUser, withRouter, withStyles(styles, { name: "InboxNavigation" }));
