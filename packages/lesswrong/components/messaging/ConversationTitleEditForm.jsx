/*

A component to configure the "Edit Title" form.

*/

import React from 'react';
import { Components, registerComponent, getFragment } from "meteor/vulcan:core";
import Conversations from '../../lib/collections/conversations/collection.js';

const ConversationTitleEditForm = props =>{
  return <Components.WrappedSmartForm
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

registerComponent('ConversationTitleEditForm', ConversationTitleEditForm);
