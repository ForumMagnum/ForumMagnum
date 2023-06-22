import React, { useState } from 'react';
import DialogContent from '@material-ui/core/DialogContent';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useNavigation } from '../../lib/routeUtil';
import { isEAForum } from '../../lib/instanceSettings';

const styles = (_theme: ThemeType) => ({
  content: {
    // This subselector is needed to beat the specificity of the default
    // MUI styles
    "&:first-child": {
      padding: isEAForum ? 0 : undefined,
    },
  },
  dialogPaper: {
    maxWidth: isEAForum ? 750 : undefined,
  },
});

const NewShortformDialog = ({onClose, classes}: {
  onClose: () => void,
  classes: ClassesType,
}) => {
  const [open, setOpen] = useState(true);
  const {history} = useNavigation();
  const {ShortformSubmitForm, LWDialog} = Components;
  return (
    <LWDialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={isEAForum ? "md" : "sm"}
      disableBackdropClick={isEAForum}
      disableEscapeKeyDown={isEAForum}
      dialogClasses={{paper: classes.dialogPaper}}
    >
      <DialogContent className={classes.content}>
        <ShortformSubmitForm
          successCallback={() => {
            onClose();
            history.push(isEAForum ? '/quicktakes' : '/shortform');
          }}
          cancelCallback={() => {
            if (isEAForum) {
              setOpen(false);
              onClose?.();
            }
          }}
        />
      </DialogContent>
    </LWDialog>
  );
}

const NewShortformDialogComponent = registerComponent(
  'NewShortformDialog',
  NewShortformDialog,
  {styles},
);

declare global {
  interface ComponentTypes {
    NewShortformDialog: typeof NewShortformDialogComponent
  }
}

