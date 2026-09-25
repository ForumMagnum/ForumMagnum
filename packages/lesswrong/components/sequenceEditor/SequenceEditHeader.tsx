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
import AutoGrowTextarea from "./AutoGrowTextarea";

const styles = defineStyles("SequenceEditHeader", (theme: ThemeType) => ({
  titleInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    padding: "2px 4px",
    margin: "0 -4px",
    borderRadius: 4,
    color: "inherit",
    font: "inherit",
    fontVariant: "inherit",
    letterSpacing: "inherit",
    resize: "none",
    overflow: "hidden",
    "&:hover": {
      background: theme.palette.greyAlpha(0.04),
    },
    "&:focus": {
      background: theme.palette.greyAlpha(0.06),
    },
    "&::placeholder": {
      color: theme.palette.text.sequenceTitlePlaceholder,
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
 * The sequence title, edited in place. Saves when the field loses focus or
 * Enter is pressed, like a post title. An empty title isn't allowed: it
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

  return <AutoGrowTextarea
    className={classNames(classes.titleInput, className)}
    value={title}
    placeholder="Sequence title"
    singleLine
    // A new sequence opens with its placeholder title selected, ready to type over.
    autoFocus={sequence.title === NEW_SEQUENCE_TITLE}
    onFocus={(e) => {
      if (e.target.value === NEW_SEQUENCE_TITLE) e.target.select();
    }}
    onChange={setTitle}
    onBlur={save}
  />;
};

/**
 * Leaves edit mode. Everything except the description has already been
 * saved, so this only asks when the description has unsaved changes.
 */
export const DoneEditingButton = ({ className, onDone }: { className?: string, onDone: () => void }) => {
  const { updateSequence, drainSaves, descriptionDraftRef, descriptionIsDirty } = useSequenceEditor();
  const [asking, setAsking] = useState(false);

  const saveAndLeave = async () => {
    const contents = await descriptionDraftRef.current?.getUnsavedContents();
    if (contents) {
      const outcome = { failed: false };
      updateSequence({ contents }, () => { outcome.failed = true; });
      await drainSaves();
      if (outcome.failed) {
        setAsking(false);
        return;
      }
      descriptionDraftRef.current?.markSaved();
    }
    onDone();
  };

  const leave = async () => {
    await drainSaves();
    onDone();
  };

  return <>
    <a className={className} onClick={() => descriptionIsDirty ? setAsking(true) : void leave()}>Done editing</a>
    {asking && <LWDialog open onClose={() => setAsking(false)}>
      <DialogTitle>Save your description changes?</DialogTitle>
      <DialogContent>Everything else is already saved.</DialogContent>
      <DialogActions>
        <Button onClick={() => setAsking(false)}>Keep editing</Button>
        <Button onClick={() => { descriptionDraftRef.current?.markSaved(); onDone(); }}>Don't save</Button>
        <Button color="primary" onClick={() => void saveAndLeave()}>Save</Button>
      </DialogActions>
    </LWDialog>}
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
