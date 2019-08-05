import { Components, registerComponent } from 'vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'vulcan:i18n';
import { STATES } from 'vulcan:accounts'

class AccountsResetPassword extends PureComponent {
  componentDidMount() {
    const token = this.props.match.params.token;
    Accounts._loginButtonsSession.set('resetPasswordToken', token);
  }

  render() {
    return <Components.WrappedLoginForm formState={ STATES.PASSWORD_CHANGE }/>
  }
}

AccountsResetPassword.contextTypes = {
  intl: intlShape
}

AccountsResetPassword.propTypes = {
  match: PropTypes.object,
};

AccountsResetPassword.displayName = 'AccountsResetPassword';

// Shadows AccountsResetPassword from vulcan:accounts
registerComponent('AccountsResetPassword', AccountsResetPassword);
