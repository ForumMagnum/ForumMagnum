import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import DialogTitle from '@material-ui/core/DialogTitle';

const styles = (theme: ThemeType): JssStyles => ({
  dialogContent: {
    padding: 30,
    minHeight: 400
  }
});

const NewModeratorActionDialog = ({classes, onClose, userId}: {
  classes: ClassesType,
  onClose: () => void,
  userId: String
}) => {
  const { WrappedSmartForm, LWDialog } = Components;
  
  return (
    <LWDialog open={true}>
      <DialogTitle>
        New Moderator Action
      </DialogTitle>
      <div className={classes.dialogContent}>
        <WrappedSmartForm
          collectionName="ModeratorActions"
          prefilledProps={{userId}}
          successCallback={() => onClose()}
          cancelLabel="Cancel"
          cancelCallback={() => onClose()}
        />
      </div>
    </LWDialog>
  )
};

const NewModeratorActionDialogComponent = registerComponent('NewModeratorActionDialog', NewModeratorActionDialog, { styles });

declare global {
  interface ComponentTypes {
    NewModeratorActionDialog: typeof NewModeratorActionDialogComponent
  }
}
