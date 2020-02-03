import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-core';

export class AccountsLoginForm extends React.Component {

  render() {
    return(
      <Components.AccountsStateSwitcher {...this.props}/>
    );
  }
}

registerComponent('AccountsLoginForm', AccountsLoginForm);
