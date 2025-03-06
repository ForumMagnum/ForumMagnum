import React, { useState } from 'react';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import LWDialog from "@/components/common/LWDialog";

// Dialog group, with trigger-button and dialog-instance
const DialogGroup = ({title, trigger, actions, children}: {
  title?: string,
  trigger: React.ReactNode,
  actions: any[],
  children?: React.ReactNode,
}) => {
  const [open,setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const actionButtons = actions.map(action =>
    <span key={action} onClick={handleClose}>{action}</span>
  )

  return (
    <span className="dialog-trigger-group">
      <span className="dialog-trigger" onClick={handleOpen}>{trigger}</span>
      <LWDialog
        open={open}
        onClose={handleClose}
      >
        {title && <DialogTitle>{title}</DialogTitle>}
        {children}
        <DialogActions>{actionButtons}</DialogActions>
      </LWDialog>
    </span>
  );
}

const DialogGroupComponent = registerComponent('DialogGroup', DialogGroup);

declare global {
  interface ComponentTypes {
    DialogGroup: typeof DialogGroupComponent
  }
}

export default DialogGroupComponent;
