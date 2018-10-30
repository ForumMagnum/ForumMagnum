import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import React from 'react';

const UsersNameWrapper = ({document, documentId, loading}) => {
  if (!document && loading) {
    return <Components.Loading />
  }
  if (document) {
    return <Components.UsersName user={document} />
  }
};

UsersNameWrapper.displayName = "UsersNameWrapper";

const options = {
  collection: Users,
  queryName: 'UsersNameWrapperQuery',
  fragmentName: 'UsersMinimumInfo',
};

registerComponent('UsersNameWrapper', UsersNameWrapper, [withDocument, options]);
