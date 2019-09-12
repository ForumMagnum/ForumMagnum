import { registerComponent, withMessages } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import Button from '@material-ui/core/Button';
import { intlShape } from 'meteor/vulcan:i18n';

class FlashMessages extends Component {
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
        message: translatedMessage || messageString,
      };
    }
  }

  render() {
    const { messages, clear } = this.props
    let messageObject = messages.length > 0 && this.getProperties(messages[0]);
    return (
      <div className="flash-messages">
        <Snackbar
          open={messages[0] && !messages[0].hide}
          message={messageObject && messageObject.message}
          autoHideDuration={6000}
          onClose={clear}
          action={messageObject?.action && <Button onClick={messageObject?.action} color="primary">{messageObject?.actionName || "UNDO"}</Button>}
        />
      </div>
    );
  }
}

FlashMessages.contextTypes = {
  intl: intlShape
}

registerComponent('FlashMessages', FlashMessages, withMessages);
