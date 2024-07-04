import React, { useState } from 'react';
import DialogContent from '@material-ui/core/DialogContent';
import { isFriendlyUI } from '@/themes/forumTheme';
import { Components, registerComponent } from '@/lib/vulcan-lib';

const styles = (_theme: ThemeType) => ({
  dialogPaper: {
    maxWidth: isFriendlyUI ? 500 : undefined,
  },
});

const DeleteAccountConfirmationModal = ({onClose, confirmAction, classes}: {
  onClose: () => void,
  confirmAction: () => Promise<void>,
  classes: ClassesType,
}) => {
  const {LWDialog, EAButton} = Components;
  const [lodaing, setLoading] = useState(false);

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      fullWidth
      maxWidth={isFriendlyUI ? "md" : "sm"}
      dialogClasses={{paper: classes.dialogPaper}}
    >
      <DialogContent className={classes.content}>
        Some kind of explanation
        <EAButton variant="outlined" onClick={onClose}>Cancel</EAButton>
        <EAButton onClick={async () => {
          await confirmAction()
          onClose()
        }}>Confirm</EAButton>
      </DialogContent>
    </LWDialog>
  );
}

const DeleteAccountConfirmationModalComponent = registerComponent(
  'DeleteAccountConfirmationModal',
  DeleteAccountConfirmationModal,
  {styles},
);

declare global {
  interface ComponentTypes {
    DeleteAccountConfirmationModal: typeof DeleteAccountConfirmationModalComponent
  }
}
