import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import Sequences from '../../lib/collections/sequences/collection.js';

const SequencesEditForm = ({ successCallback, cancelCallback, removeSuccessCallback }) => {
  const { params } = useLocation();
  return (
    <div className="sequences-edit-form">
      <Components.WrappedSmartForm
        collection={Sequences}
        documentId={params._id}
        successCallback={successCallback}
        cancelCallback={cancelCallback}
        removeSuccessCallback={removeSuccessCallback}
        showRemove={true}
        queryFragment={getFragment('SequencesEdit')}
        mutationFragment={getFragment('SequencesEdit')}
      />
    </div>
  )
}

registerComponent('SequencesEditForm', SequencesEditForm, withMessages);
