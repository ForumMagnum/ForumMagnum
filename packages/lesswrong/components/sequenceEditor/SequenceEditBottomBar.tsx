import React, { useState } from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { primaryEditorButtonStyles, secondaryEditorButtonStyles } from "./editorButtonStyles";
import ForumIcon from "../common/ForumIcon";
import { useSequenceEditor } from "./SequenceEditorContext";
import type { SaveStatus } from "./useSequentialSaveQueue";
import SequenceSettingsDialog from "./SequenceSettingsDialog";
import SequenceDeleteDialog from "./SequenceDeleteDialog";
import SequenceEditMenu from "./SequenceEditMenu";

const styles = defineStyles("SequenceEditBottomBar", (theme: ThemeType) => ({
  root: {
    position: "fixed",
    bottom: 16,
    left: "50%",
    transform: "translateX(-50%)",
    width: "calc(100% - 32px)",
    maxWidth: 765,
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "0 12px 0 20px",
    background: theme.palette.panelBackground.default,
    border: theme.palette.greyBorder("1px", 0.12),
    borderRadius: 12,
    boxShadow: `0 4px 16px ${theme.palette.boxShadowColor(0.12)}`,
    zIndex: theme.zIndexes.header - 1,
    [theme.breakpoints.down("xs")]: {
      bottom: 0,
      width: "100%",
      borderRadius: 0,
      borderLeft: "none",
      borderRight: "none",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    },
  },
  status: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    color: theme.palette.greyAlpha(0.55),
  },
  statusError: {
    color: theme.palette.error.main,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    border: theme.palette.greyBorder("1px", 0.16),
    background: theme.palette.panelBackground.default,
    color: theme.palette.greyAlpha(0.75),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.greyAlpha(0.96),
      borderColor: theme.palette.greyAlpha(0.25),
    },
  },
  settingsIcon: {
    width: 18,
    height: 18,
  },
  secondaryButton: secondaryEditorButtonStyles(theme),
  primaryButton: primaryEditorButtonStyles(theme),
}));

const statusLabels: Record<SaveStatus, string> = {
  idle: "Changes save as you go",
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save your last change",
};

const SequenceEditBottomBar = () => {
  const classes = useStyles(styles);
  const { sequence, saveStatus, saveSequenceNow, descriptionDraftRef } = useSequenceEditor();
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Publish and Move to Drafts include any unsaved description changes in
  // the same update, so the two can't get out of step.
  const setDraft = async (draft: boolean) => {
    setIsChangingStatus(true);
    try {
      const unsavedContents = await descriptionDraftRef.current?.getUnsavedContents();
      const saved = await saveSequenceNow({ draft, ...(unsavedContents ? { contents: unsavedContents } : {}) });
      if (unsavedContents && saved) {
        descriptionDraftRef.current?.markSaved();
      }
    } finally {
      setIsChangingStatus(false);
    }
  };

  return <div className={classes.root}>
    {/* Rendered here rather than through openDialog so it stays inside the
        sequence editor's context. */}
    {settingsOpen && <SequenceSettingsDialog onClose={() => setSettingsOpen(false)} />}
    {deleteOpen && <SequenceDeleteDialog onClose={() => setDeleteOpen(false)} />}
    <span className={saveStatus === "error" ? classes.statusError : classes.status}>
      {statusLabels[saveStatus]}
    </span>
    <div className={classes.actions}>
      <SequenceEditMenu
        label="More actions"
        items={[{ title: "Delete sequence", onClick: () => setDeleteOpen(true) }]}
      />
      <button className={classes.settingsButton} onClick={() => setSettingsOpen(true)} title="Settings">
        <ForumIcon icon="Settings" className={classes.settingsIcon} />
      </button>
      {sequence.draft
        ? <button className={classes.primaryButton} disabled={isChangingStatus} onClick={() => setDraft(false)}>
            {isChangingStatus ? "Publishing…" : "Publish"}
          </button>
        : <button className={classes.secondaryButton} disabled={isChangingStatus} onClick={() => setDraft(true)}>
            {isChangingStatus ? "Saving…" : "Move to Drafts"}
          </button>
      }
    </div>
  </div>;
};

export default SequenceEditBottomBar;
