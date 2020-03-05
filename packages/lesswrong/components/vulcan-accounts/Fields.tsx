import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-core';

export class AccountsFields extends React.Component<any> {
  render () {
    let { fields = {}, className = 'fields' } = this.props;
    return (
      <div className={ className }>
        {Object.keys(fields).map((id, i) =>
          <Components.AccountsField {...fields[id]} key={i} />
        )}
      </div>
    );
  }
}

const AccountsFieldsComponent = registerComponent('AccountsFields', AccountsFields);

declare global {
  interface ComponentTypes {
    AccountsFields: typeof AccountsFieldsComponent
  }
}

