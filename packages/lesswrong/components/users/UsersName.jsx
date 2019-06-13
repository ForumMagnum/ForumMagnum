import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';

const UsersName = ({user, documentId, nofollow=false}) => {
  if (documentId) {
    return <Components.UsersNameWrapper documentId={documentId} nofollow={nofollow} />
  } else if(user) {
    return <Components.UsersNameDisplay user={user} nofollow={nofollow} />
  } else {
    return <Components.UserNameDeleted />
  }
}
UsersName.propTypes = {
  user: PropTypes.object,
  documentId: PropTypes.string,
}

UsersName.displayName = 'UsersName';

registerComponent('UsersName', UsersName);
