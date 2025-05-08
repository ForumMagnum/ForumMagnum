import React, { useState } from 'react';
import { DialogContent } from "@/components/widgets/DialogContent";
import { registerComponent } from '../../lib/vulcan-lib/components';
import { isFriendlyUI } from '../../themes/forumTheme';
import { useNavigate } from '../../lib/routeUtil';
import { ShortformSubmitForm } from "./ShortformSubmitForm";
import { LWDialog } from "../common/LWDialog";

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

const NewShortformDialogInner = ({onClose, classes}: {
  onClose: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
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

export const NewShortformDialog = registerComponent(
  'NewShortformDialog',
  NewShortformDialogInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    NewShortformDialog: typeof NewShortformDialog
  }
}
