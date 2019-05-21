import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';
import React from 'react';
import Collections from '../../lib/collections/collections/collection.js';

const CollectionsEditForm = (props) => {
  return (
    <div className="chapters-edit-form">
      <Components.WrappedSmartForm
        collection={Collections}
        documentId={props.documentId}
        successCallback={props.successCallback}
        cancelCallback={props.cancelCallback}
        showRemove={true}
        queryFragment={getFragment('CollectionsEditFragment')}
        mutationFragment={getFragment('CollectionsPageFragment')}
      />
    </div>
  )
}

registerComponent('CollectionsEditForm', CollectionsEditForm, withMessages);
