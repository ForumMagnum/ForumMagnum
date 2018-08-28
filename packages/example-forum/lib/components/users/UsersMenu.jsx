import { Components, registerComponent, withCurrentUser } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { Meteor } from 'meteor/meteor';
import Users from 'meteor/vulcan:users';
import { withApollo } from 'react-apollo';

const UsersMenu = ({ currentUser, client }) => {
  const menuItems = [
    {
      to: `/users/${currentUser.slug}`,
      labelId: 'users.profile',
    },
    {
      to: `/account`,
      labelId: 'users.edit_account',
    },
  ];

  if (Users.isAdmin(currentUser)) {
    menuItems.push({
      to: `/admin/users`,
      labelId: 'admin.users',
    });
    menuItems.push({
      to: `/admin/categories`,
      labelId: 'admin.categories',
    });
  }

  menuItems.push({
    labelId: 'users.log_out',
    itemProps: {
      onClick: () => Meteor.logout(() => client.resetStore()),
    },
  });

  return (
    <div className="users-menu">
      <Components.Dropdown
        variant="default"
        id="user-dropdown"
        trigger={
          <div className="dropdown-toggle-inner">
            <Components.Avatar size="small" user={currentUser} addLink={false} />
            <div className="users-menu-name">{Users.getDisplayName(currentUser)}</div>
          </div>
        }
        pullRight
        menuItems={menuItems}
      />
    </div>
  );
};

UsersMenu.propsTypes = {
  currentUser: PropTypes.object,
  client: PropTypes.object,
};

registerComponent('UsersMenu', UsersMenu, withCurrentUser, withApollo);
