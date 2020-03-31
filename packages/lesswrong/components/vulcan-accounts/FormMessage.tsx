import React from 'react';
import { registerComponent } from '../../lib/vulcan-core';
import * as _ from 'underscore';

export class AccountsFormMessage extends React.Component<any> {
  render () {
    let { message, type, className = 'message', style = {} } = this.props;
    message = _.isObject(message) ? message.message : message; // If message is object, then try to get message from it
    return message ? (
      <div style={style} className={[className, type].join(' ')}>{ message }</div>
    ) : null;
  }
}

const AccountsFormMessageComponent = registerComponent('AccountsFormMessage', AccountsFormMessage);

declare global {
  interface ComponentTypes {
    AccountsFormMessage: typeof AccountsFormMessageComponent
  }
}

