import React from 'react';
import { styles } from './SequencesNewForm';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { getFragment } from "../../lib/vulcan-lib/fragments";

const SequencesEditForm = ({ documentId, successCallback, cancelCallback, removeSuccessCallback, classes }: {
  documentId: string,
  successCallback?: () => void,
  cancelCallback?: () => void,
  removeSuccessCallback?: any,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.sequencesForm}>
      <Components.WrappedSmartForm
        collectionName="Sequences"
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

const SequencesEditFormComponent = registerComponent('SequencesEditForm', SequencesEditForm, {styles});

declare global {
  interface ComponentTypes {
    SequencesEditForm: typeof SequencesEditFormComponent
  }
}

