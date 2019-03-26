import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';
import React from 'react';
import { withRouter } from 'react-router';
import Sequences from '../../lib/collections/sequences/collection.js';

const SequencesEditForm = (props, context) => {
  return (
    <div className="sequences-edit-form">
      <Components.WrappedSmartForm
        collection={Sequences}
        documentId={props.params._id}
        successCallback={props.successCallback}
        cancelCallback={props.cancelCallback}
        removeSuccessCallback={props.removeSuccessCallback}
        showRemove={true}
        queryFragment={getFragment('SequencesEdit')}
        mutationFragment={getFragment('SequencesPageFragment')}
      />
    </div>
  )
}

registerComponent('SequencesEditForm', SequencesEditForm, withMessages, withRouter);
