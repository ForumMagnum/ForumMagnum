"use client";

import React from 'react';
import { styles } from './SequencesNewForm';
import { SequencesForm } from './SequencesForm';
import { useStyles } from '../hooks/useStyles';

const SequencesEditForm = ({ sequence, currentUser, successCallback, cancelCallback }: {
  sequence: SequencesEdit,
  currentUser: UsersCurrent,
  successCallback: () => void,
  cancelCallback: () => void,
}) => {
  const classes = useStyles(styles);
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

export default SequencesEditForm;
