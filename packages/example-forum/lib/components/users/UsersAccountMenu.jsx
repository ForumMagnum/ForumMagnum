import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { STATES } from 'meteor/vulcan:accounts';

const UsersAccountMenu = ({ state }) => (
  <Components.Dropdown
    variant="default"
    id="accounts-dropdown"
    className="users-account-menu"
    trigger={
      <div className="dropdown-toggle-inner">
        <Components.Icon name="user" />
        <FormattedMessage id="users.sign_up_log_in" />
      </div>
    }
    pullRight
    menuContents={<Components.AccountsLoginForm formState={state ? STATES[state] : STATES.SIGN_UP} />}
  />
);

UsersAccountMenu.displayName = 'UsersAccountMenu';

registerComponent('UsersAccountMenu', UsersAccountMenu);
