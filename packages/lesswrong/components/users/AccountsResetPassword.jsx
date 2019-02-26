import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'meteor/vulcan:i18n';
import { STATES } from 'meteor/vulcan:accounts'

class AccountsResetPassword extends PureComponent {
  componentDidMount() {
    const token = this.props.params.token;
    Accounts._loginButtonsSession.set('resetPasswordToken', token);
  }

  render() {
    return <Components.AccountsLoginForm formState={ STATES.PASSWORD_CHANGE }/>
  }
}

AccountsResetPassword.contextTypes = {
  intl: intlShape
}

AccountsResetPassword.propTypes = {
  params: PropTypes.object,
};

AccountsResetPassword.displayName = 'AccountsResetPassword';

// Shadows AccountsResetPassword from vulcan:accounts
registerComponent('AccountsResetPassword', AccountsResetPassword);
