import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';

const UsersName = ({user, documentId}) => {
  if (documentId) {
    return <Components.UsersNameWrapper documentId={documentId} />
  } else if(user) {
    return <Components.UsersNameDisplay user={user}/>
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
