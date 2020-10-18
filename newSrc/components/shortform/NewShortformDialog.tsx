import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useNavigation } from '../../lib/routeUtil';


const NewShortformDialog = ({onClose}: {
  onClose: any,
}) => {
  const { ShortformSubmitForm } = Components;
  const { history } = useNavigation();
  return (
    <Dialog open={true}
      onClose={onClose}
      fullWidth maxWidth="sm"
      disableEnforceFocus
    >
      <DialogContent>
        <ShortformSubmitForm
          successCallback={() => {
            onClose();
            history.push('/shortform');
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

const NewShortformDialogComponent = registerComponent('NewShortformDialog', NewShortformDialog);

declare global {
  interface ComponentTypes {
    NewShortformDialog: typeof NewShortformDialogComponent
  }
}

