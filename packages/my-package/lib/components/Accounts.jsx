import Telescope from 'meteor/nova:lib';
import React, { PropTypes, Component } from 'react';
import { Accounts } from 'meteor/std:accounts-ui';
import { withApollo } from 'react-apollo';

Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_EMAIL',
});

const AccountsComponent = ({client}) => {
  return (
    <div>
      <Accounts.ui.LoginForm 
        onPostSignUpHook={() => client.resetStore()}
        onSignedInHook={() => client.resetStore()}
        onSignedOutHook={() => client.resetStore()}
      />
    </div>
  )
}

export default withApollo(AccountsComponent);