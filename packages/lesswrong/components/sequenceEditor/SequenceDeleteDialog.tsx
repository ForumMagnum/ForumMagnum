import React, { useState } from "react";
import LWDialog from "../common/LWDialog";
import { DialogTitle } from "../widgets/DialogTitle";
import { DialogContent } from "../widgets/DialogContent";
import { DialogActions } from "../widgets/DialogActions";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { useNavigate } from "@/lib/routeUtil";
import { userGetProfileUrl } from "@/lib/collections/users/helpers";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useSequenceEditor } from "./SequenceEditorContext";

const styles = defineStyles("SequenceDeleteDialog", (theme: ThemeType) => ({
  deleteButton: {
    color: theme.palette.error.main,
  },
}));

/** Confirms deleting the sequence, then goes to the author's profile. */
const SequenceDeleteDialog = ({ onClose }: { onClose: () => void }) => {
  const classes = useStyles(styles);
  const navigate = useNavigate();
  const { sequence, saveSequenceNow } = useSequenceEditor();
  const [deleting, setDeleting] = useState(false);

  const deleteSequence = async () => {
    setDeleting(true);
    const deleted = await saveSequenceNow({ isDeleted: true });
    setDeleting(false);
    if (!deleted) return;
    onClose();
    navigate(sequence.user ? userGetProfileUrl(sequence.user) : "/library");
  };

  return <LWDialog open onClose={onClose}>
    <DialogTitle>Delete “{sequence.title}”?</DialogTitle>
    <DialogContent>
      The sequence will be hidden from the whole site. Its posts aren't affected.
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button className={classes.deleteButton} disabled={deleting} onClick={() => void deleteSequence()}>
        {deleting ? "Deleting…" : "Delete sequence"}
      </Button>
    </DialogActions>
  </LWDialog>;
};

export default SequenceDeleteDialog;
