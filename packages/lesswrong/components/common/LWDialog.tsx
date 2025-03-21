import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
// eslint-disable-next-line no-restricted-imports
import Dialog, { DialogProps, DialogClassKey } from '@/lib/vendor/@material-ui/core/src/Dialog';

// Wrapped to ensure the disableEnforceFocus prop is provided, since not
// providing that breaks the toolbar in CkEditor and DraftJS. Also provides a
// centralized place to fix it if we discover other issues with MUI Dialog, or
// want to write it ourselves.
const LWDialog = ({children, dialogClasses, ...dialogProps}: {
  children: React.ReactNode,
  dialogClasses?: Partial<Record<DialogClassKey, string>>,
} & DialogProps) => {
  return (
    <Dialog
      disableEnforceFocus
      classes={dialogClasses}
      {...dialogProps}
    >
      {children}
    </Dialog>
  );
}

const LWDialogComponent = registerComponent('LWDialog', LWDialog);

declare global {
  interface ComponentTypes {
    LWDialog: typeof LWDialogComponent
  }
}
