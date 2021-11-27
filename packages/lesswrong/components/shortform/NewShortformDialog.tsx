import React from 'react';
import DialogContent from '@material-ui/core/DialogContent';
import { userHasMinCommentKarma } from '../../lib/collections/users/helpers'
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useNavigation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';


const NewShortformDialog = ({onClose}: {
  onClose: any,
}) => {
  const { ShortformSubmitForm, LWDialog, KarmaThresholdNotice } = Components;
  const { history } = useNavigation();
  const currentUser = useCurrentUser();

  if (!userHasMinCommentKarma(currentUser!)) {
    return (<LWDialog
      open={true}
      maxWidth={false}
      onClose={onClose}
    >
      <KarmaThresholdNotice thresholdType="comment" disabledAbility="write on Shortform" />
    </LWDialog>)
  }

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

