import React from 'react';
import './Button';
import { Components, registerComponent } from '../../lib/vulcan-core';

export class Buttons extends React.Component<any> {
  render () {
    let { buttons = {}, className = 'buttons' } = this.props;
    return (
      <div className={ className }>
        {Object.keys(buttons).map((id, i) =>
          <Components.AccountsButton {...buttons[id]} key={i} />
        )}
      </div>
    );
  }
}

const AccountsButtonsComponent = registerComponent('AccountsButtons', Buttons);

declare global {
  interface ComponentTypes {
    AccountsButtons: typeof AccountsButtonsComponent
  }
}

