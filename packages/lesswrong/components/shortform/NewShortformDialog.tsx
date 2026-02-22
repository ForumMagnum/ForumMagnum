import { DialogContent } from "@/components/widgets/DialogContent";
import { useState } from 'react';
import { useNavigate } from '../../lib/routeUtil';
import { registerComponent } from '../../lib/vulcan-lib/components';
import LWDialog from "../common/LWDialog";
import ShortformSubmitForm from "./ShortformSubmitForm";

const styles = (theme: ThemeType) => ({
  content: {
    // This subselector is needed to beat the specificity of the default
    // MUI styles
    "&:first-child": {
      padding: "0 20px 20px",
    },
  },
  dialogPaper: {
},
});

const NewShortformDialog = ({onClose, classes}: {
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
      maxWidth={"sm"}
      disableBackdropClick={true}
      disableEscapeKeyDown={true}
      paperClassName={classes.dialogPaper}
    >
      <DialogContent className={classes.content}>
        <ShortformSubmitForm
          successCallback={() => {
            onClose();
            navigate('/shortform');
          }}
          cancelCallback={() => {
            setOpen(false);
            onClose?.();
          }}
          defaultExpanded={true}
          submitButtonAtBottom={true}
        />
      </DialogContent>
    </LWDialog>
  );
}

export default registerComponent(
  'NewShortformDialog',
  NewShortformDialog,
  {styles},
);


