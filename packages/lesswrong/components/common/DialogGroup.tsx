import React, { useState } from 'react';
import DialogTitle from '@/lib/vendor/@material-ui/core/src/DialogTitle';
import DialogActions from '@/lib/vendor/@material-ui/core/src/DialogActions';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

// Dialog group, with trigger-button and dialog-instance
const DialogGroup = ({title, trigger, actions, children}: {
  title?: string,
  trigger: React.ReactNode,
  actions: any[],
  children?: React.ReactNode,
}) => {
  const [open,setOpen] = useState(false);
  const { LWDialog } = Components;

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
