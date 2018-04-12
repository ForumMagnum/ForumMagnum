import { Components, registerComponent, withCurrentUser, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';

const UsersAccount = (props, /* context*/) => {

  // note: terms is as the same as a document-shape the SmartForm edit-mode expects to receive
  const terms = props.params.slug ? { slug: props.params.slug } : props.currentUser ? { documentId: props.currentUser._id } : {};

  const mapsAPIKey = getSetting('googleMaps.apiKey', null);
  return <div>
    <Helmet><script src={`https://maps.googleapis.com/maps/api/js?key=${mapsAPIKey}&libraries=places`}/></Helmet>
    <Components.UsersEditForm terms={terms} />
  </div>
};

UsersAccount.propTypes = {
  currentUser: PropTypes.object
};

UsersAccount.displayName = 'UsersAccount';

registerComponent('UsersAccount', UsersAccount, withCurrentUser);
