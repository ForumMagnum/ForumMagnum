import React, { Component } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-core';

export class AccountsFormMessages extends Component<any> {
  render () {
    const { messages = [], className = 'messages', style = {} } = this.props;
    return messages.length > 0 && (
      <div className={className} style={style}>
        {messages
          .filter(message => !('field' in message))
          .map(({ message, type }, i) =>
          <Components.AccountsFormMessage
            message={message}
            type={type}
            key={i}
          />
        )}
      </div>
    );
  }
}

const AccountsFormMessagesComponent = registerComponent('AccountsFormMessages', AccountsFormMessages);

declare global {
  interface ComponentTypes {
    AccountsFormMessages: typeof AccountsFormMessagesComponent
  }
}

