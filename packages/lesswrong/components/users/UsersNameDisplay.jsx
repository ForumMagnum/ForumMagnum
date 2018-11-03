import { registerComponent, Components, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router';

const UsersNameDisplay = ({user}) => {
  return <Link className="users-name" to={Users.getProfileUrl(user)}>
    {getSetting('AlignmentForum', false) ? (user.fullName || Users.getDisplayName(user)) : Users.getDisplayName(user)}
  </Link>
}

UsersNameDisplay.propTypes = {
  user: PropTypes.object.isRequired,
}

UsersNameDisplay.displayName = 'UsersNameDisplay';

registerComponent('UsersNameDisplay', UsersNameDisplay);
