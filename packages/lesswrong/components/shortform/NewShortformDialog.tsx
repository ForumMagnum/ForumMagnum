import React, { useState } from 'react';
import DialogContent from '@material-ui/core/DialogContent';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useNavigation } from '../../lib/routeUtil';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (_theme: ThemeType) => ({
  content: {
    // This subselector is needed to beat the specificity of the default
    // MUI styles
    "&:first-child": {
      padding: isFriendlyUI ? 0 : undefined,
    },
  },
  dialogPaper: {
    maxWidth: isFriendlyUI ? 750 : undefined,
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
      maxWidth={isFriendlyUI ? "md" : "sm"}
      disableBackdropClick={isFriendlyUI}
      disableEscapeKeyDown={isFriendlyUI}
      dialogClasses={{paper: classes.dialogPaper}}
    >
      <DialogContent className={classes.content}>
        <ShortformSubmitForm
          successCallback={() => {
            onClose();
            history.push(isFriendlyUI ? '/quicktakes' : '/shortform');
          }}
          cancelCallback={() => {
            setOpen(false);
            onClose?.();
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

