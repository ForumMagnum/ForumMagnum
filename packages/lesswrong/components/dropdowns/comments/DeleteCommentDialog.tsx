import React, { useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useMessages } from '../../common/withMessages';
import { useModerateComment } from './withModerateComment'
import { DialogActions } from '@/components/widgets/DialogActions';
import { DialogContent } from '../../widgets/DialogContent';
import { DialogTitle } from '../../widgets/DialogTitle';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import TextField from '@/lib/vendor/@material-ui/core/src/TextField';
import { isFriendlyUI } from '../../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  subtitle: {
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
  },
  deleteWithoutTrace: {
    marginRight:"auto"
  },
  modalTextField: {
    marginTop: 10,
  },
})

const DeleteCommentDialog = ({comment, onClose, classes}: {
  comment: CommentsList,
  onClose?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const [deletedReason, setDeletedReason] = useState("");
  const {moderateCommentMutation} = useModerateComment({fragmentName: "CommentsList"});
  const { flash } = useMessages();

  const handleDelete = (event: React.MouseEvent) => {
    event.preventDefault();
    void moderateCommentMutation({
      commentId: comment._id,
      deleted: true,
      deletedPublic: false,
      deletedReason: deletedReason,
    }).then(()=>{
      flash({messageString: "Successfully deleted comment", type: "success"})
      if (onClose)
        onClose();
    }).catch(/* error */);
  }

  const handleDeletePublic = (event: React.MouseEvent) => {

    event.preventDefault();
    void moderateCommentMutation({
      commentId: comment._id,
      deleted: true,
      deletedPublic: true,
      deletedReason: deletedReason,
    }).then(()=>{
      flash({messageString: "Successfully deleted comment", type: "success"})
      if (onClose)
        onClose();
    }).catch(/* error */);
  }

  const render = () => {
    const { LWDialog } = Components;
    return (
      <LWDialog open={true} onClose={onClose}>
        <DialogTitle>
          What is your reason for deleting this comment?
        </DialogTitle>
        <DialogContent>
          <p className={classes.subtitle}><em>
            (If you delete without a trace, the reason will be sent to the
            author of the comment privately. Otherwise it will be publicly
            displayed below the comment.)
          </em></p>
          <br/>
          <TextField
            id="comment-menu-item-delete-reason"
            label="Reason for deleting (optional)"
            className={classes.modalTextField}
            value={deletedReason}
            onChange={(event) => setDeletedReason(event.target.value)}
            fullWidth
            multiline
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDelete} className={classes.deleteWithoutTrace}>
            Delete Without Trace
          </Button>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button color="primary" onClick={handleDeletePublic}>
            Delete
          </Button>
        </DialogActions>
      </LWDialog>
    )
  }
  return render();
}

const DeleteCommentDialogComponent = registerComponent(
  'DeleteCommentDialog', DeleteCommentDialog, {styles}
);

declare global {
  interface ComponentTypes {
    DeleteCommentDialog: typeof DeleteCommentDialogComponent
  }
}
