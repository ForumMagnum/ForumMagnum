import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import React from 'react';
import { Error404 } from 'meteor/vulcan:core';

const UsersSingle = (props) => {
  if (props.document) {
    return <Components.UsersName user={props.document} />
  } else {
    return <div>{props.documentId}</div>
  }
};

UsersSingle.displayName = "UsersSingle";

const options = {
  collection: Users,
  queryName: 'UsersSingleQuery',
  fragmentName: 'UsersList',
  limit: 1,
  totalResolver: false,
};

registerComponent('UsersSingle', UsersSingle, [withDocument, options]);
