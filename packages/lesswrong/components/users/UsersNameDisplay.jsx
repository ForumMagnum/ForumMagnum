import { registerComponent, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router';
import Tooltip from '@material-ui/core/Tooltip';

const UsersNameDisplay = ({user}) => {
  const bio = !!user.bio && user.bio

  const userLink = <Link to={Users.getProfileUrl(user)}>
    {getSetting('AlignmentForum', false) ? (user.fullName || Users.getDisplayName(user)) : Users.getDisplayName(user)}
  </Link>

  if (bio) {
    return <Tooltip title={bio}>{ userLink }</Tooltip>
  } else {
    return userLink
  }
}

UsersNameDisplay.propTypes = {
  user: PropTypes.object.isRequired,
}

UsersNameDisplay.displayName = 'UsersNameDisplay';

registerComponent('UsersNameDisplay', UsersNameDisplay);
