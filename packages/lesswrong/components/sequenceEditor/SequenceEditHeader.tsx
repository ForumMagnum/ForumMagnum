import React, { useState } from "react";
import classNames from "classnames";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useImageUpload } from "../hooks/useImageUpload";
import { useMessages } from "../common/withMessages";
import LWDialog from "../common/LWDialog";
import { DialogTitle } from "../widgets/DialogTitle";
import { DialogContent } from "../widgets/DialogContent";
import { DialogActions } from "../widgets/DialogActions";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { useSequenceEditor } from "./SequenceEditorContext";
import Input from "@/lib/vendor/@material-ui/core/src/Input";

const styles = defineStyles("SequenceEditHeader", (theme: ThemeType) => ({
  titleInput: {
    width: "100%",
    padding: "2px 4px",
    margin: "0 -4px",
    borderRadius: 4,
    color: "inherit",
    font: "inherit",
    fontVariant: "inherit",
    letterSpacing: "inherit",
    "&:hover": {
      background: theme.palette.greyAlpha(0.04),
    },
    "&:focus-within": {
      background: theme.palette.greyAlpha(0.06),
    },
    "& textarea::placeholder": {
      color: theme.palette.text.sequenceTitlePlaceholder,
      opacity: 1,
    },
  },
  bannerControls: {
    position: "absolute",
    top: 16,
    left: 16,
    display: "flex",
    gap: 8,
    zIndex: theme.zIndexes.sequencesPageContent,
  },
  bannerButton: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    fontWeight: 500,
    padding: "6px 12px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    background: theme.palette.buttons.imageUpload.background,
    color: theme.palette.text.invertedBackgroundText,
    "&:hover": {
      background: theme.palette.buttons.imageUpload.hoverBackground,
    },
  },
}));

/** The title a new sequence is created with, before its author names it. */
export const NEW_SEQUENCE_TITLE = "Untitled Sequence";

/**
 * The sequence title, edited in place. Saves when the field loses focus,
 * like a post title (EditTitle). An empty title isn't allowed: it
 * reverts to the last saved title.
 */
export const SequenceTitleInput = ({ className }: { className?: string }) => {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const { sequence, updateSequence } = useSequenceEditor();
  const [title, setTitle] = useState(sequence.title);
  const [lastSavedTitle, setLastSavedTitle] = useState(sequence.title);

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(lastSavedTitle);
      flash("A sequence needs a title.");
      return;
    }
    if (trimmed === lastSavedTitle) {
      return;
    }
    const previousTitle = lastSavedTitle;
    setLastSavedTitle(trimmed);
    updateSequence({ title: trimmed }, () => {
      setTitle(previousTitle);
      setLastSavedTitle(previousTitle);
    });
  };

  return <Input
    className={classNames(classes.titleInput, className)}
    value={title}
    placeholder="Sequence title"
    multiline
    disableUnderline
    inputProps={{ "aria-label": "Sequence title" }}
    onChange={(event) => setTitle(event.target.value)}
    onBlur={save}
  />;
};

/**
 * Leaving edit mode. Everything except the description has already been
 * saved, so `requestLeave` only asks (through `confirmDialog`, which the
 * caller renders) when the description has unsaved changes. It asks the
 * description editor itself rather than trusting the live "unsaved" flag,
 * which can lag a few seconds behind typing. Every way out waits for queued
 * live saves first, so reading mode loads the chapters after they've landed.
 */
export function useDoneEditing(onDone: () => void) {
  const { saveSequenceNow, drainSaves, descriptionDraftRef } = useSequenceEditor();
  const [asking, setAsking] = useState(false);

  const leave = async () => {
    await drainSaves();
    onDone();
  };

  const saveAndLeave = async () => {
    const contents = await descriptionDraftRef.current?.getUnsavedContents();
    if (contents) {
      if (!await saveSequenceNow({ contents })) {
        setAsking(false);
        return;
      }
      descriptionDraftRef.current?.markSaved();
    }
    onDone();
  };

  const leaveWithoutSaving = async () => {
    descriptionDraftRef.current?.discard();
    await leave();
  };

  const requestLeave = async () => {
    if (await descriptionDraftRef.current?.getUnsavedContents()) {
      setAsking(true);
      return;
    }
    await leave();
  };

  const confirmDialog = asking && <LWDialog open onClose={() => setAsking(false)}>
    <DialogTitle>Save your description changes?</DialogTitle>
    <DialogContent>Everything else is already saved.</DialogContent>
    <DialogActions>
      <Button onClick={() => setAsking(false)}>Keep editing</Button>
      <Button onClick={() => void leaveWithoutSaving()}>Don't save</Button>
      <Button color="primary" onClick={() => void saveAndLeave()}>Save</Button>
    </DialogActions>
  </LWDialog>;

  return { requestLeave, confirmDialog };
}

/** The "Done editing" link beside the sequence's author line. */
export const DoneEditingButton = ({ className, onDone }: { className?: string, onDone: () => void }) => {
  const { requestLeave, confirmDialog } = useDoneEditing(onDone);
  return <>
    <a className={className} onClick={() => void requestLeave()}>Done editing</a>
    {confirmDialog}
  </>;
};

export const SequenceBannerControls = () => {
  const classes = useStyles(styles);
  const { sequence, updateSequence } = useSequenceEditor();
  const { uploadImage } = useImageUpload({
    imageType: "bannerImageId",
    onUploadSuccess: (bannerImageId: string) => updateSequence({ bannerImageId }),
    onUploadError: (error: Error) => {
      // eslint-disable-next-line no-console
      console.error("Banner image upload failed:", error);
    },
  });

  return <div className={classes.bannerControls}>
    <button className={classes.bannerButton} onClick={uploadImage}>
      {sequence.bannerImageId ? "Change banner" : "Add banner"}
    </button>
    {sequence.bannerImageId && <button className={classes.bannerButton} onClick={() => updateSequence({ bannerImageId: null })}>
      Remove banner
    </button>}
  </div>;
};
