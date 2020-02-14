import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-core';

export class AccountsLoginForm extends React.Component<any> {

  render() {
    return(
      <Components.AccountsStateSwitcher {...this.props}/>
    );
  }
}

const AccountsLoginFormComponent = registerComponent('AccountsLoginForm', AccountsLoginForm);

declare global {
  interface ComponentTypes {
    AccountsLoginForm: typeof AccountsLoginFormComponent
  }
}

