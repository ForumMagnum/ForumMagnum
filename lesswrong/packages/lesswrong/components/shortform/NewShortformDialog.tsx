import React, { useState } from 'react';
import DialogContent from '@material-ui/core/DialogContent';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { isFriendlyUI } from '../../themes/forumTheme';
import { useNavigate } from '../../lib/routeUtil';

const styles = (_theme: ThemeType) => ({
  content: {
    // This subselector is needed to beat the specificity of the default
    // MUI styles
    "&:first-child": {
      padding: isFriendlyUI ? 0 : "0 20px 20px",
    },
  },
  dialogPaper: {
    maxWidth: isFriendlyUI ? 750 : undefined,
  },
});

const NewShortformDialog = ({onClose, classes}: {
  onClose: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const {ShortformSubmitForm, LWDialog} = Components;
  return (
    <LWDialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={isFriendlyUI ? "md" : "sm"}
      disableBackdropClick={true}
      disableEscapeKeyDown={true}
      dialogClasses={{paper: classes.dialogPaper}}
    >
      <DialogContent className={classes.content}>
        <ShortformSubmitForm
          successCallback={() => {
            onClose();
            navigate(isFriendlyUI ? '/quicktakes' : '/shortform');
          }}
          cancelCallback={() => {
            setOpen(false);
            onClose?.();
          }}
          defaultExpanded={!isFriendlyUI}
          submitButtonAtBottom={!isFriendlyUI}
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
