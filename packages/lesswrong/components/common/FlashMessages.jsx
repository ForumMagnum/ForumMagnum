import { Components, replaceComponent, withMessages } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Snackbar from 'material-ui/Snackbar';
import { intlShape } from 'meteor/vulcan:i18n';

class FlashMessages extends Component {
  handleRequestClose = () => {
    let message = this.props.messages.filter(message => message.show)[0];
    this.setState({
      open: false,
    });
    if(message) {
      this.props.markAsSeen(message._id);
      this.props.clear(message._id);
    }
  };

  getProperties = (message) => {
    if (typeof message === 'string') {
      // if error is a string, use it as message
      return {
        message: message,
        type: 'error'
      }
    } else {
      // else return full error object after internationalizing message
      const { id, messageString, properties } = message;
      const translatedMessage = this.context.intl.formatMessage({ id, defaultMessage: messageString }, properties);
      return {
        ...message,
        message: translatedMessage,
      };
    }
  }

  render() {
    let messages = this.props.messages.filter(message => message.show);
    let messageObject = messages.length > 0 && messages[0].id && this.getProperties(messages[0]);
    return (
      <div className="flash-messages">
        <Snackbar
          open={!!messageObject}
          message={messageObject && messageObject.message}
          autoHideDuration = {4000}
          onRequestClose={this.handleRequestClose}
        />
      </div>
    );
  }
}

FlashMessages.contextTypes = {
  intl: intlShape
}



FlashMessages.displayName = "FlashMessages";

replaceComponent('FlashMessages', FlashMessages, withMessages);
