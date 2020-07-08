import { registerComponent } from '../../lib/vulcan-lib';
import { withMessages } from './withMessages';
import React, { PureComponent } from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import Button from '@material-ui/core/Button';

interface ExternalProps {
}
interface FlashMessagesProps extends ExternalProps, WithMessagesProps {
}

class FlashMessages extends PureComponent<FlashMessagesProps,{}> {
  getProperties = (message) => {
    if (typeof message === 'string') {
      // if error is a string, use it as message
      return {
        message: message,
        type: 'error'
      }
    } else {
      // else return full error object after internationalizing message
      const { messageString } = message;
      return {
        ...message,
        message: messageString,
      };
    }
  }

  render() {
    const { messages, clear } = this.props
    let messageObject = messages.length > 0 && this.getProperties(messages[0]);
    return (
      <div className="flash-messages">
        <Snackbar
          open={messageObject && !messageObject.hide}
          message={messageObject && messageObject.message}
          autoHideDuration={6000}
          onClose={clear}
          action={messageObject?.action && <Button onClick={messageObject?.action} color="primary">{messageObject?.actionName || "UNDO"}</Button>}
        />
      </div>
    );
  }
}

const FlashMessagesComponent = registerComponent<ExternalProps>('FlashMessages', FlashMessages, {
  hocs: [withMessages]
});

declare global {
  interface ComponentTypes {
    FlashMessages: typeof FlashMessagesComponent
  }
}
