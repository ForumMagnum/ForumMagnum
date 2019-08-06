import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import React from 'react';
import PropTypes from 'prop-types';

// Given a user ID (as documentId), load that user with a HoC, and display
// their name. If the nofollow attribute is true OR the user has a spam-risk
// score below 0.8, the user-page link will be marked nofollow.
const UsersNameWrapper = ({document, loading, nofollow=false, simple=false}) => {
  if (!document && loading) {
    return <Components.Loading />
  }
  if (document) {
    return <Components.UsersNameDisplay user={document} nofollow={nofollow || document.spamRiskScore<0.8} simple={simple}/>
  }
  return null
};

UsersNameWrapper.propTypes = {
  document: PropTypes.object,
  loading: PropTypes.bool
}

const options = {
  collection: Users,
  queryName: 'UsersNameWrapperQuery',
  fragmentName: 'UsersMinimumInfo',
};

registerComponent('UsersNameWrapper', UsersNameWrapper, [withDocument, options]);
