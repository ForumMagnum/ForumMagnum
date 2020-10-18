import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent } from '../../lib/vulcan-core';

export class AccountsButton extends PureComponent<any> {
  render () {

    const {
      label,
      // href = null,
      type,
      disabled = false,
      className,
      onClick
    } = this.props;

    return type === 'link' ? 
      <a href="#" className={className} onClick={onClick} style={{marginRight: '10px'}}>{label}</a> :
      <Components.Button
        style={{marginRight: '10px'}}
        variant="primary"
        className={className}
        type={type}
        disabled={disabled}
        onClick={onClick}>
        {label}
      </Components.Button>;
  }
}
(AccountsButton as any).propTypes = {
  onClick: PropTypes.func
};

const AccountsButtonComponent = registerComponent('AccountsButton', AccountsButton);

declare global {
  interface ComponentTypes {
    AccountsButton: typeof AccountsButtonComponent
  }
}

