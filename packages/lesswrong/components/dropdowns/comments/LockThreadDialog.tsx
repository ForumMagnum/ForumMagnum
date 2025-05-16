import React, { useState } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useMutation } from '@apollo/client';
import { DialogActions } from '@/components/widgets/DialogActions';
import { DialogContent } from '@/components/widgets/DialogContent';
import { DialogTitle } from '@/components/widgets/DialogTitle';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { gql } from '@/lib/generated/gql-codegen/gql';
import moment from 'moment';
import { isFriendlyUI } from '../../../themes/forumTheme';
import LWDialog from "../../common/LWDialog";
import { DatePicker } from "../../form-components/FormComponentDateTime";

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

  const [lockThread] = useMutation(gql(`
    mutation lockThread($commentId: String!, $until: String) {
      lockThread(commentId: $commentId, until: $until)
    }
  `));
  const handleLockThread = async () => {
    await lockThread({
      variables: {
        commentId,
        until: until.toISOString(),
      }
    });
    onClose();

    // HACK: The cient-side cache doesn't update to reflect this change, so
    // hard-refresh the page
    window.location.reload();
  }
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

export default registerComponent(
  'LockThreadDialog', LockThreadDialog, {styles},
);


