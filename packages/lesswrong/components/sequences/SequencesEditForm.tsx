"use client";

import React from 'react';
import { styles } from './SequencesNewForm';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { SequencesForm } from './SequencesForm';

const SequencesEditForm = ({ sequence, currentUser, successCallback, cancelCallback, classes }: {
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

export default registerComponent('SequencesEditForm', SequencesEditForm, {styles});



