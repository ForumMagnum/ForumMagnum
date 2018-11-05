import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import React from 'react';
import PropTypes from 'prop-types';

const UsersNameWrapper = ({document, documentId, loading}) => {
  if (!document && loading) {
    return <Components.Loading />
  }
  if (document) {
    return <Components.UsersNameDisplay user={document} />
  }
};

UsersNameWrapper.displayName = "UsersNameWrapper";

UsersNameWrapper.propTypes = {
  documentId: PropTypes.string.isRequired,
  document: PropTypes.object,
  loading: PropTypes.bool
}

const options = {
  collection: Users,
  queryName: 'UsersNameWrapperQuery',
  fragmentName: 'UsersMinimumInfo',
};

registerComponent('UsersNameWrapper', UsersNameWrapper, [withDocument, options]);
