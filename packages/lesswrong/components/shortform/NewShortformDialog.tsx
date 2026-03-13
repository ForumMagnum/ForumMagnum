import React, { useState } from 'react';
import { DialogContent } from "@/components/widgets/DialogContent";
import { isFriendlyUI } from '../../themes/forumTheme';
import { useNavigate } from '../../lib/routeUtil';
import ShortformSubmitForm from "./ShortformSubmitForm";
import LWDialog from "../common/LWDialog";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('NewShortformDialog', (theme: ThemeType) => ({
  content: {
    // This subselector is needed to beat the specificity of the default
    // MUI styles
    "&:first-child": {
      padding: theme.isFriendlyUI ? 0 : "0 20px 20px",
    },
  },
  dialogPaper: {
    maxWidth: theme.isFriendlyUI ? 750 : undefined,
  },
}));

const NewShortformDialog = ({onClose}: {
  onClose: () => void,
}) => {
  const classes = useStyles(styles);
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  return (
    <LWDialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={isFriendlyUI() ? "md" : "sm"}
      disableBackdropClick={true}
      disableEscapeKeyDown={true}
      paperClassName={classes.dialogPaper}
    >
      <DialogContent className={classes.content}>
        <ShortformSubmitForm
          successCallback={() => {
            onClose();
            navigate(isFriendlyUI() ? '/quicktakes' : '/shortform');
          }}
          cancelCallback={() => {
            setOpen(false);
            onClose?.();
          }}
          defaultExpanded={!isFriendlyUI()}
          submitButtonAtBottom={!isFriendlyUI()}
        />
      </DialogContent>
    </LWDialog>
  );
}

export default NewShortformDialog;


