import React from 'react';
import { styles } from './SequencesNewForm';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { SequencesForm } from './SequencesForm';

const SequencesEditFormInner = ({ sequence, currentUser, successCallback, cancelCallback, classes }: {
  sequence: SequencesEdit,
  currentUser: UsersCurrent,
  successCallback: () => void,
  cancelCallback: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.sequencesForm}>
      <SequencesForm
        initialData={sequence}
        currentUser={currentUser}
        onSuccess={successCallback}
        onCancel={cancelCallback}
      />
    </div>
  )
}

export const SequencesEditForm = registerComponent('SequencesEditForm', SequencesEditFormInner, {styles});

declare global {
  interface ComponentTypes {
    SequencesEditForm: typeof SequencesEditForm
  }
}

