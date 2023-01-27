import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import React, { useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  rejectCommentButton: {
    marginRight:"auto"
  },
  modalTextField: {
    marginTop: 10,
  },
})

const RejectCommentDialog = ({rejectComment, onClose, classes}: {
  rejectComment: (rejectionReason?: string) => Promise<void>,
  onClose: () => void,
  classes: ClassesType,
}) => {
  const { Loading } = Components;

  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    setLoading(true)
    await rejectComment(rejectionReason);
    setLoading(false);
    onClose();
  };

  const render = () => {
    const { LWDialog } = Components;
    return (
      <LWDialog open={true} onClose={onClose}>
        <DialogTitle>
          What is your reason for rejecting this comment?
        </DialogTitle>
        <DialogContent>
          <TextField
            id="comment-menu-item-reject-reason"
            label="Reason for rejecting (optional)"
            className={classes.modalTextField}
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            fullWidth
            multiline
          />
        </DialogContent>
        <DialogActions>
          {loading
            ? <Loading />
            : <Button onClick={handleReject} className={classes.rejectCommentButton}>
                Reject Comment
              </Button>
          }
          <Button onClick={onClose}>
            Cancel
          </Button>
        </DialogActions>
      </LWDialog>
    )
  }
  return render();
}

const RejectCommentDialogComponent = registerComponent(
  'RejectCommentDialog', RejectCommentDialog, {styles}
);

declare global {
  interface ComponentTypes {
    RejectCommentDialog: typeof RejectCommentDialogComponent
  }
}
