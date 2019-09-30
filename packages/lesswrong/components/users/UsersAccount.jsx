import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import withUser from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';

const UsersAccount = ({currentUser}) => {
  const { params } = useLocation();
  
  // note: terms is as the same as a document-shape the SmartForm edit-mode expects to receive
  const terms = params.slug ? { slug: params.slug } : currentUser ? { documentId: currentUser._id } : {};
  return <div>
    <Components.UsersEditForm terms={terms} />
  </div>
};

UsersAccount.propTypes = {
  currentUser: PropTypes.object
};

registerComponent('UsersAccount', UsersAccount, withUser);
