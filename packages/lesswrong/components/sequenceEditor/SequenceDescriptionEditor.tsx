import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import { useEditorFormCallbacks, EditorFormComponent } from "../editor/EditorFormComponent";
import { sanitizeEditableFieldValues } from "../tanstack-form-components/helpers";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useSequenceEditor } from "./SequenceEditorContext";

const styles = defineStyles("SequenceDescriptionEditor", (theme: ThemeType) => ({
  root: {
    marginTop: 16,
    marginBottom: 16,
    // The shared editor is sized for post bodies; a sequence description is
    // usually a paragraph or two, so let it start small and grow.
    "& .EditorFormComponent-postEditorHeight": {
      minHeight: 80,
    },
    "& .LexicalPostEditor-editorShell": {
      "--lexical-editor-min-height": "80px",
    },
  },
  // Always rendered, so the page doesn't shift when the buttons activate.
  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    minHeight: 36,
    marginTop: 4,
  },
  button: {
    ...theme.typography.commentStyle,
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 8,
    padding: "6px 14px",
    cursor: "pointer",
    "&:disabled": {
      opacity: 0.35,
      cursor: "default",
    },
  },
  cancelButton: {
    background: "none",
    border: theme.palette.greyBorder("1px", 0.14),
    color: theme.palette.greyAlpha(0.68),
    "&:hover:enabled": {
      background: theme.palette.greyAlpha(0.04),
    },
  },
  saveButton: {
    background: theme.palette.buttons.alwaysPrimary,
    color: theme.palette.text.alwaysWhite,
    border: "none",
    "&:hover:enabled": {
      background: theme.palette.primary.dark,
    },
  },
}));

/**
 * The sequence description, edited in place. Unlike everything else on the
 * page it doesn't save as you go: it has its own Save / Publish changes and
 * Cancel buttons. Publish and Move to Drafts in the bottom bar also save it,
 * through the handle registered in descriptionDraftRef.
 */
function editorText(contents: SequencesEdit["contents"]): string {
  return contents?.originalContents?.data ?? "";
}

const SequenceDescriptionEditor = () => {
  const classes = useStyles(styles);
  const { sequence, updateSequence, drainSaves, descriptionDraftRef, descriptionIsDirty, setDescriptionIsDirty } = useSequenceEditor();
  // Changing the key remounts the editor, which is how Cancel restores the
  // saved text.
  const [editorKey, setEditorKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const { onSubmitCallback, onSuccessCallback, addOnSubmitCallback, addOnSuccessCallback } = useEditorFormCallbacks<SequencesEdit>();

  const form = useForm({
    defaultValues: { contents: sequence.contents },
  });

  // Whether the description is unsaved is decided by comparing the editor's
  // text with the last saved text. (The form field's own dirty flag isn't
  // reliable here: the editor re-sends its contents after a save, in a
  // slightly different shape, which marks the field dirty again.)
  const savedTextRef = useRef(editorText(sequence.contents));
  const hasUnsavedText = useCallback(
    () => editorText(form.state.values.contents) !== savedTextRef.current,
    [form],
  );

  const getUnsavedContents = useCallback(async () => {
    if (!hasUnsavedText()) {
      return undefined;
    }
    await onSubmitCallback.current?.();
    return sanitizeEditableFieldValues({ contents: form.state.values.contents }, ["contents"]).contents ?? undefined;
  }, [form, onSubmitCallback, hasUnsavedText]);

  // After a save, make the current text the new baseline, and clear the
  // editor's browser backup without clearing the editor.
  const markSaved = useCallback(() => {
    savedTextRef.current = editorText(form.state.values.contents);
    form.reset(form.state.values);
    onSuccessCallback.current?.(sequence, { noReload: true });
    setDescriptionIsDirty(false);
  }, [form, onSuccessCallback, sequence, setDescriptionIsDirty]);

  useEffect(() => {
    descriptionDraftRef.current = { getUnsavedContents, markSaved };
    return () => { descriptionDraftRef.current = null; };
  }, [descriptionDraftRef, getUnsavedContents, markSaved]);

  useEffect(() => form.store.subscribe(() => {
    setDescriptionIsDirty(hasUnsavedText());
  }), [form, hasUnsavedText, setDescriptionIsDirty]);

  const save = async () => {
    setIsSaving(true);
    try {
      const contents = await getUnsavedContents();
      if (!contents) return;
      const outcome = { failed: false };
      updateSequence({ contents }, () => { outcome.failed = true; });
      await drainSaves();
      if (!outcome.failed) {
        markSaved();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const cancel = () => {
    form.reset();
    onSuccessCallback.current?.(sequence, { noReload: true });
    setDescriptionIsDirty(false);
    setEditorKey((key) => key + 1);
  };

  return <div className={classes.root}>
    <form.Field name="contents">
      {(field) => <EditorFormComponent
        key={editorKey}
        field={field}
        name="contents"
        formType="edit"
        document={{ ...sequence, contents: form.state.values.contents }}
        addOnSubmitCallback={addOnSubmitCallback}
        addOnSuccessCallback={addOnSuccessCallback}
        hintText="Add a description…"
        fieldName="contents"
        collectionName="Sequences"
        commentEditor={false}
        commentStyles={false}
        // No editor-type switcher or "minor update" selector: those belong to
        // the post editor, not an inline description.
        hideControls
        // Entering edit mode shouldn't jump focus into the description.
        autoFocus={false}
      />}
    </form.Field>
    <div className={classes.buttonRow}>
      <button className={classNames(classes.button, classes.cancelButton)} disabled={!descriptionIsDirty || isSaving} onClick={cancel}>
        Cancel
      </button>
      <button className={classNames(classes.button, classes.saveButton)} disabled={!descriptionIsDirty || isSaving} onClick={save}>
        {isSaving ? "Saving…" : (sequence.draft ? "Save" : "Publish changes")}
      </button>
    </div>
  </div>;
};

export default SequenceDescriptionEditor;
