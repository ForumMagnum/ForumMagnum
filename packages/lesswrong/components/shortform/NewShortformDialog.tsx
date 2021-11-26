import React from 'react';
import DialogContent from '@material-ui/core/DialogContent';
import { userHasMinCommentKarma } from '../../lib/collections/posts/helpers'
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useNavigation } from '../../lib/routeUtil';


const NewShortformDialog = ({onClose}: {
  onClose: any,
}) => {
  const { ShortformSubmitForm, LWDialog } = Components;
  if (!userHasMinCommentKarma(currentUser!)) {
    return (<LWDialog
      open={true}
      maxWidth={false}
      onClose={onClose}
    >
      <DialogContent>
      Your karma is below the threshold for writing on Shortform.
      </DialogContent>
    </LWDialog>)
  }
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

