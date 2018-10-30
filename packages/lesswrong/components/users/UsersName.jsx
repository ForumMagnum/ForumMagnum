import { registerComponent, Components, getSetting, withDocument } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router';

const UsersName = ({user, document, documentId, loading}) => {
  if (documentId) {
    return <Components.UsersNameWrapper documentId={documentId} />
  } else {
    return <Link className="users-name" to={Users.getProfileUrl(user)}>
      {getSetting('AlignmentForum', false) ? (user.fullName || Users.getDisplayName(user)) : Users.getDisplayName(user)}
    </Link>
  }
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
