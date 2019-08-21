import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';
import React from 'react';
import Chapters from '../../lib/collections/chapters/collection.js';

//TODO: Manage chapter removal to remove the reference from all parent-sequences

const ChaptersEditForm = ({documentId, successCallback, cancelCallback}) => {
  return (
    <div className="chapters-edit-form">
      <h3>Add/Remove Posts</h3>
      <Components.WrappedSmartForm
        collection={Chapters}
        documentId={documentId}
        successCallback={successCallback}
        cancelCallback={cancelCallback}
        showRemove={true}
        queryFragment={getFragment('ChaptersEdit')}
        mutationFragment={getFragment('ChaptersEdit')}
      />
    </div>
  )
}

registerComponent('ChaptersEditForm', ChaptersEditForm, withMessages);
