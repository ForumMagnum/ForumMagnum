import { registerComponent, Components, getSetting, withDocument } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router';

const UsersName = ({user, document, documentId, loading}) => {
  if (documentId && loading) {
    return <Components.Loading/>
  }
  const userInfo = document || user
  return <Link className="users-name" to={Users.getProfileUrl(userInfo)}>
    {getSetting('AlignmentForum', false) ? (userInfo.fullName || Users.getDisplayName(userInfo)) : Users.getDisplayName(userInfo)}
  </Link>
}
UsersName.propTypes = {
  user: PropTypes.object.isRequired,
}

UsersName.displayName = 'UsersName';

const documentOptions = {
  collection: Users,
  queryName: 'UsersNameQuery',
  fragmentName: 'UsersMinimumInfo',
};

registerComponent('UsersName', UsersName, [withDocument, documentOptions]);
