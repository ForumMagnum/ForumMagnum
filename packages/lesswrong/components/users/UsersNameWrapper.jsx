import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import React from 'react';

const UsersNameWrapper = (props) => {
  if (props.document) {
    return <Components.UsersName user={props.document} />
  } else {
    return <div>{props.documentId}</div>
  }
};

UsersNameWrapper.displayName = "UsersNameWrapper";

const options = {
  collection: Users,
  queryName: 'UsersNameWrapperQuery',
  fragmentName: 'UsersList',
  limit: 1,
  totalResolver: false,
};

registerComponent('UsersNameWrapper', UsersNameWrapper, [withDocument, options]);
