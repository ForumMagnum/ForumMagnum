/*

The Navigation for the Inbox components

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { LinkContainer } from 'react-router-bootstrap';
import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import ListGroup from 'react-bootstrap/lib/ListGroup';
import ListGroupItem from 'react-bootstrap/lib/ListGroupItem'; 
import { Components, registerComponent, withList, withCurrentUser } from 'meteor/vulcan:core';
import moment from 'moment';
import Conversations from '../../lib/collections/conversations/collection.js';

class InboxNavigation extends Component {

  render() {
    const results = this.props.results;
    const currentUser = this.props.currentUser;
    const select = this.props.location.query.select;

    const messagesTerms = {view: 'messagesConversation', conversationId: select};

    if(currentUser && results) {
      let conversation = results.length ? results.find(c => (c._id == select)) : null;
      let notificationsSelect = (select == "Notifications");

      let conversationDetails = conversation ? <Components.ConversationDetails conversation={conversation}/> : <div></div>
      let thereAreNone = notificationsSelect ? <p>You have no notifications.</p> : <p>There are no messages in this conversation.</p>
      let notificationsWrapper = results.length ? <Components.NotificationsWrapper/> : thereAreNone

      return (
        <Grid>
          <Row className="Inbox-Grid">
            <Col xs={12} md={3}>{this.renderNavigation()}</Col>
            <Col xs={12} style={{position: "inherit"}} md={(notificationsSelect ? 9 : 6)}>
              {notificationsSelect ? notificationsWrapper : <Components.ConversationWrapper terms={messagesTerms} conversation={conversation} />}
            </Col>
            {notificationsSelect ? <div></div> : <Col xs={12} md={3}>{conversationDetails}</Col>}
          </Row>
        </Grid>
      )
    } else {
      return <div></div>
    }
  }

  renderNavigation() {
    const results = this.props.results;

    //TODO: Add ability to add conversation from Inbox page, by searching for a user id:15

    if(results && results.length){
      return (
        <ListGroup>
          <LinkContainer to={{pathname: "/inbox", query: {select: "Notifications"}}}>
            <ListGroupItem header="All Notifications">
            </ListGroupItem>
          </LinkContainer>
          {results.map(conversation =>
            <LinkContainer key={conversation._id} to={{pathname: "/inbox", query: {select: conversation._id}}}>
              <ListGroupItem>
                {!!conversation.title ? conversation.title : _.pluck(conversation.participants, 'username').join(' - ')}
                <br></br> {conversation.latestActivity ? moment(new Date(conversation.latestActivity)).fromNow() : null}
              </ListGroupItem>
            </LinkContainer>)
          }
        </ListGroup>
      );
    } else {
      return <div>Loading...</div>;
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

registerComponent('InboxNavigation', InboxNavigation, [withList, conversationOptions], withCurrentUser, withRouter);
