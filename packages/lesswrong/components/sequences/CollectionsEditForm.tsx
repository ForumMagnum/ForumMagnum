import { Components, registerComponent, getFragment } from 'meteor/vulcan:core';
import React from 'react';
import Collections from '../../lib/collections/collections/collection';

const CollectionsEditForm = ({documentId, successCallback, cancelCallback}) => {
  return (
    <div className="chapters-edit-form">
      <Components.WrappedSmartForm
        collection={Collections}
        documentId={documentId}
        successCallback={successCallback}
        cancelCallback={cancelCallback}
        showRemove={true}
        queryFragment={getFragment('CollectionsEditFragment')}
        mutationFragment={getFragment('CollectionsPageFragment')}
      />
    </div>
  )
}

const CollectionsEditFormComponent = registerComponent('CollectionsEditForm', CollectionsEditForm);

declare global {
  interface ComponentTypes {
    CollectionsEditForm: typeof CollectionsEditFormComponent
  }
}

