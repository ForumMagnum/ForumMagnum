import { Components, registerComponent } from 'meteor/vulcan:core';
import { withSingle } from '../../lib/crud/withSingle';
import Users from 'meteor/vulcan:users';
import React from 'react';
import PropTypes from 'prop-types';

// Given a user ID (as documentId), load that user with a HoC, and display
// their name. If the nofollow attribute is true OR the user has a spam-risk
// score below 0.8, the user-page link will be marked nofollow.
const UsersNameWrapper = ({document, loading, nofollow=false, simple=false}: {
  document?: UsersMinimumInfo|null,
  loading: boolean,
  nofollow?: boolean,
  simple?: boolean,
}) => {
  if (!document && loading) {
    return <Components.Loading />
  }
  if (document) {
    return <Components.UsersNameDisplay user={document} nofollow={nofollow || document.spamRiskScore<0.8} simple={simple}/>
  }
  return null
};

const UsersNameWrapperComponent = registerComponent(
  'UsersNameWrapper', UsersNameWrapper,
  withSingle({
    collection: Users,
    fragmentName: 'UsersMinimumInfo',
  })
);

declare global {
  interface ComponentTypes {
    UsersNameWrapper: typeof UsersNameWrapperComponent
  }
}
