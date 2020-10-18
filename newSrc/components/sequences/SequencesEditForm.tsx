import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import React from 'react';
import Sequences from '../../lib/collections/sequences/collection';

const SequencesEditForm = ({ documentId, successCallback, cancelCallback, removeSuccessCallback }: {
  documentId: string,
  successCallback?: ()=>void,
  cancelCallback?: ()=>void,
  removeSuccessCallback?: any,
}) => {
  return (
    <div className="sequences-edit-form">
      <Components.WrappedSmartForm
        collection={Sequences}
        documentId={documentId}
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

const SequencesEditFormComponent = registerComponent('SequencesEditForm', SequencesEditForm);

declare global {
  interface ComponentTypes {
    SequencesEditForm: typeof SequencesEditFormComponent
  }
}

