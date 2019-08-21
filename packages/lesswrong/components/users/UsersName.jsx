import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';

const UsersName = ({user, documentId, nofollow=false, simple=false}) => {
  if (documentId) {
    return <Components.UsersNameWrapper documentId={documentId} nofollow={nofollow} simple={simple} />
  } else if(user) {
    return <Components.UsersNameDisplay user={user} nofollow={nofollow} simple={simple} />
  } else {
    return <Components.UserNameDeleted />
  }
}
UsersName.propTypes = {
  user: PropTypes.object,
  documentId: PropTypes.string,
}

registerComponent('UsersName', UsersName);
