import React from 'react';
import DialogContent from '@material-ui/core/DialogContent';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useNavigation } from '../../lib/routeUtil';


const NewShortformDialog = ({onClose}: {
  onClose: any,
}) => {
  const { ShortformSubmitForm, LWDialog } = Components;
  const { history } = useNavigation();
  return (
    <LWDialog open={true}
      onClose={onClose}
      fullWidth maxWidth="sm"
    >
      <DialogContent>
        <ShortformSubmitForm
          successCallback={() => {
            onClose();
            history.push('/shortform');
          }}
        />
      </DialogContent>
    </LWDialog>
  );
}

const NewShortformDialogComponent = registerComponent('NewShortformDialog', NewShortformDialog);

declare global {
  interface ComponentTypes {
    NewShortformDialog: typeof NewShortformDialogComponent
  }
}

