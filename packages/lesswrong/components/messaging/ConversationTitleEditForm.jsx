/*

A component to configure the "Edit Title" form.

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getFragment } from "meteor/vulcan:core";
import Conversations from '../../lib/collections/conversations/collection.js';

const TitleEditForm = props =>{
  return <Components.SmartForm
    collection={Conversations}
    documentId={props.documentId}
    fragment={getFragment('conversationsListFragment')}
    queryFragment={getFragment('conversationsListFragment')}
    mutationFragment={getFragment('conversationsListFragment')}
    successCallback={document => {
      props.closeModal();
    }}
  />
}

registerComponent('TitleEditForm', TitleEditForm);
