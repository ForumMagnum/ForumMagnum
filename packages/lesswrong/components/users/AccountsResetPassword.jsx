import { Components, registerComponent, withCurrentUser } from 'meteor/vulcan:core';
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

AccountsResetPassword.propsTypes = {
  currentUser: PropTypes.object,
  params: PropTypes.object,
};

AccountsResetPassword.displayName = 'AccountsResetPassword';

registerComponent('AccountsResetPassword', AccountsResetPassword, withCurrentUser);
