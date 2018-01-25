/*

Button used to start a new conversation for a given user

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import Dialog from 'material-ui/Dialog';
import { Components, registerComponent, withCurrentUser, getFragment } from 'meteor/vulcan:core';
import {  withRouter } from 'react-router';
import Conversations from '../../lib/collections/conversations/collection.js';

class NewConversationButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    }
  }
  handleOpen = () => {
    console.log("HandleOpen called")
    this.setState({open: true});
  }
  handleClose = () => {
    this.setState({open: false});
  }

  render() {
    const { user, currentUser, buttonComponent, children } = this.props;

    if (currentUser) {
      return (
        <div>
          <div className="new-conversation-button" onClick={this.handleOpen}>
            {children}
          </div>
          <div className="new-conversation-dialog">
            <Dialog
              title="Start a new conversation"
              modal={true}
              open={this.state.open}
              onRequestClose={this.handleClose}
            >
              <Components.SmartForm
                collection={Conversations}
                mutationFragment={getFragment('newConversationFragment')}
                prefilledProps={{participantIds: [currentUser._id, user._id]}}
                successCallback={conversation => {
                  this.handleClose();
                  this.props.router.push({pathname: '/inbox', query: {select: conversation._id}});
                }}
              />
              <br />
              You can send your actual message on the next screen, after entering a Title (better interface is in the works)
            </Dialog>
          </div>
        </div>
      )
    } else {
      return <Components.Loading />
    }
  }
}

NewConversationButton.propTypes = {
  user: PropTypes.object.isRequired,
  buttonComponent: PropTypes.element.isRequired,
  currentUser: PropTypes.object,
};

registerComponent('NewConversationButton', NewConversationButton, withCurrentUser, withRouter);
