import React, { useState } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useMessages } from '../../common/withMessages';
import { useModerateComment } from './withModerateComment';
import { DialogActions } from '@/components/widgets/DialogActions';
import { DialogContent } from '../../widgets/DialogContent';
import { DialogTitle } from '../../widgets/DialogTitle';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import TextField from '@/lib/vendor/@material-ui/core/src/TextField';
import { isFriendlyUI } from '../../../themes/forumTheme';
import LWDialog from "../../common/LWDialog";

const styles = (theme: ThemeType) => ({
  subtitle: {
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
  },
  modalTextField: {
    marginTop: 10,
  },
})

const EditDeleteReasonDialog = ({comment, onClose, classes}: {
  comment: CommentsList,
  onClose?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const [deletedReason, setDeletedReason] = useState(comment.deletedReason || "");
  const {moderateCommentMutation} = useModerateComment();
  const { flash } = useMessages();

  const handleSave = async (event: React.MouseEvent) => {
    event.preventDefault();
    try {
      await moderateCommentMutation({
        commentId: comment._id,
        deleted: true,
        deletedPublic: comment.deletedPublic,
        deletedReason: deletedReason,
      });
      flash({messageString: "Successfully updated delete reason", type: "success"});
      if (onClose) {
        onClose();
      }
    } catch(e) {
      flash({messageString: e.message, type: "error"});
    }
  }

  return (
    <LWDialog open={true} onClose={onClose}>
      <DialogTitle>
        Edit Delete Reason
      </DialogTitle>
      <DialogContent>
        <p className={classes.subtitle}><em>
          {comment.deletedPublic 
            ? "This reason is publicly displayed below the comment."
            : "This reason is sent privately to the comment author."
          }
        </em></p>
        <br/>
        <TextField
          id="edit-delete-reason"
          label="Reason for deletion"
          className={classes.modalTextField}
          value={deletedReason}
          onChange={(event) => setDeletedReason(event.target.value)}
          fullWidth
          multiline
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button color="primary" onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </LWDialog>
  );
}

export default registerComponent(
  'EditDeleteReasonDialog', EditDeleteReasonDialog, {styles}
); 