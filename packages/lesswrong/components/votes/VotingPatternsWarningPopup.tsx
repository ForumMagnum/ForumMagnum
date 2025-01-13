import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Button from '@material-ui/core/Button';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';

const styles = (theme: ThemeType) => ({
  dismissButton: {
  },
});

const VotingPatternsWarningPopup = ({onClose, classes}: {
  onClose?: () => void,
  classes: ClassesType<typeof styles>
}) => {
  const { LWDialog } = Components;
  
  return <LWDialog open={true}>
    <DialogTitle>
      Hang on there
    </DialogTitle>
    <DialogContent>
      <p>You're voting pretty fast. Please only vote on things you've actually read. Mass-voting directed towards a user or topic is against site rules.</p>
      
      <Button onClick={onClose} className={classes.dismissButton}>
        Acknowledge
      </Button>
    </DialogContent>
  </LWDialog>
}

const VotingPatternsWarningPopupComponent = registerComponent('VotingPatternsWarningPopup', VotingPatternsWarningPopup, {styles});

declare global {
  interface ComponentTypes {
    VotingPatternsWarningPopup: typeof VotingPatternsWarningPopupComponent
  }
}
