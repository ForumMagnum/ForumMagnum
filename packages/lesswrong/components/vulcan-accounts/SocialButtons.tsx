import React from 'react';
import './Button';
import { Components, registerComponent } from '../../lib/vulcan-core';


export class AccountsSocialButtons extends React.Component<any> {
  render() {
    let { oauthServices = {}, className = 'social-buttons' } = this.props;
    return(
      <div className={ className }>
        {Object.keys(oauthServices).map((id, i) => {
          return <Components.AccountsButton {...oauthServices[id]} key={i} />;
        })}
      </div>
    );
  }
}

const AccountsSocialButtonsComponent = registerComponent('AccountsSocialButtons', AccountsSocialButtons);

declare global {
  interface ComponentTypes {
    AccountsSocialButtons: typeof AccountsSocialButtonsComponent
  }
}

