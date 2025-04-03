import React, { useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useMutation, gql } from '@apollo/client';
import DialogTitle from '@/lib/vendor/@material-ui/core/src/DialogTitle';
import DialogActions from '@/lib/vendor/@material-ui/core/src/DialogActions';
import DialogContent from '@/lib/vendor/@material-ui/core/src/DialogContent';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import moment from 'moment';
import { isFriendlyUI } from '../../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  message: {
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
  },
});

const LockThreadDialog = ({commentId, onClose, classes}: {
  commentId: string,
  onClose: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const farFuture: Date = moment().add(1000,'years').toDate();
  const [until,setUntil] = useState<Date>(farFuture);

  const [lockThread] = useMutation(gql`
    mutation lockThread($commentId: String!, $until: String) {
      lockThread(commentId: $commentId, until: $until)
    }
  `);
  const handleLockThread = async () => {
    await lockThread({
      variables: {
        commentId,
        until: until
      }
    });
    onClose();

    // HACK: The cient-side cache doesn't update to reflect this change, so
    // hard-refresh the page
    window.location.reload();
  }

  const {LWDialog, DatePicker} = Components;
  return (
    <LWDialog open={true} onClose={onClose}>
      <DialogTitle>Lock Comment Thread</DialogTitle>
      <DialogContent>
        <p className={classes.message}>
          Prevent replies to this comment and all comments descended from it
        </p>

        <DatePicker
          label="Locked until"
          name="lockUntil"
          value={until ?? undefined}
          onChange={(newValue: Date) => setUntil(newValue)}
        />

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleLockThread}>Confirm</Button>
      </DialogActions>
    </LWDialog>
  );
}

const LockThreadDialogComponent = registerComponent(
  'LockThreadDialog', LockThreadDialog, {styles},
);

declare global {
  interface ComponentTypes {
    LockThreadDialog: typeof LockThreadDialogComponent
  }
}
