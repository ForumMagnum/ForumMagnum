import React from 'react';
import DialogContent from '@material-ui/core/DialogContent';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useNavigation } from '../../lib/routeUtil';
import { isEAForum } from '../../lib/instanceSettings';

const styles = (_theme: ThemeType) => ({
  content: {
    // This subselector is needed to beat the specificity of the default
    // MUI styles
    "&:first-child": {
      padding: isEAForum ? 20 : undefined,
    },
  },
});

const NewShortformDialog = ({onClose, classes}: {
  onClose: () => void,
  classes: ClassesType,
}) => {
  const {history} = useNavigation();
  const {ShortformSubmitForm, LWDialog} = Components;
  return (
    <LWDialog
      open
      onClose={onClose}
      fullWidth
      maxWidth={isEAForum ? "md" : "sm"}
    >
      <DialogContent className={classes.content}>
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

const NewShortformDialogComponent = registerComponent(
  'NewShortformDialog',
  NewShortformDialog,
  {styles},
);

declare global {
  interface ComponentTypes {
    NewShortformDialog: typeof NewShortformDialogComponent
  }
}

