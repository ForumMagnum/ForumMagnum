import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import { useEditorFormCallbacks, EditorFormComponent } from "../editor/EditorFormComponent";
import { sanitizeEditableFieldValues } from "../tanstack-form-components/helpers";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useSequenceEditor } from "./SequenceEditorContext";

const styles = defineStyles("SequenceDescriptionEditor", (theme: ThemeType) => ({
  root: {
    // Same spacing as the description in reading mode (SequencesPage), whose
    // posts start 28px below it; here that space comes after the buttons.
    marginTop: 16,
    marginBottom: 28,
    // The shared editor is sized for post bodies, with a large minimum
    // height. The description should be exactly as tall as its text.
    "& .EditorFormComponent-postEditorHeight": {
      minHeight: 0,
    },
    "& .LexicalPostEditor-editorShell": {
      "--lexical-editor-min-height": "0px",
    },
    "& .LexicalContentEditable-root": {
      minHeight: 0,
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

function editorText(contents: { originalContents?: { data?: string | null } | null } | null | undefined): string {
  return contents?.originalContents?.data ?? "";
}

/**
 * The sequence description, edited in place. Unlike everything else on the
 * page it doesn't save as you go: it has its own Save / Publish changes and
 * Cancel buttons. Publish, Move to Drafts and Done editing also save it (or
 * ask about it), through the handle registered in descriptionDraftRef.
 */
const SequenceDescriptionEditor = () => {
  const classes = useStyles(styles);
  const { sequence, saveSequenceNow, descriptionDraftRef, descriptionIsDirty, setDescriptionIsDirty } = useSequenceEditor();
  // Changing the key remounts the editor, which is how Cancel restores the
  // saved text.
  const [editorKey, setEditorKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const { onSubmitCallback, onSuccessCallback, addOnSubmitCallback, addOnSuccessCallback } = useEditorFormCallbacks<SequencesEdit>();

  const form = useForm({
    defaultValues: { contents: sequence.contents },
  });

  // The saved description, kept current as saves update the cached sequence.
  const savedContentsRef = useRef(sequence.contents);
  savedContentsRef.current = sequence.contents;

  // Set once the author has changed the description since it was last saved
  // or cancelled. Loading an older (CKEditor/draftJS) description can reformat
  // it without the author changing anything, so an unchanged editor is never
  // treated as unsaved.
  const editedRef = useRef(false);

  // Unsaved means edited, and different from the saved text. The editor only
  // copies its text into the form every few seconds, so callers that act on
  // this flush it first (getUnsavedContents); the live flag below is just for
  // enabling the buttons.
  const hasUnsavedText = useCallback(
    () => editedRef.current && editorText(form.state.values.contents) !== editorText(savedContentsRef.current),
    [form],
  );

  const getUnsavedContents = useCallback(async () => {
    if (!editedRef.current) {
      return undefined;
    }
    await onSubmitCallback.current?.();
    if (!hasUnsavedText()) {
      return undefined;
    }
    return sanitizeEditableFieldValues({ contents: form.state.values.contents }, ["contents"]).contents ?? undefined;
  }, [form, onSubmitCallback, hasUnsavedText]);

  // Clears the editor's browser backup without clearing the editor.
  const clearBackup = useCallback(() => {
    onSuccessCallback.current?.(sequence, { noReload: true });
  }, [onSuccessCallback, sequence]);

  const markSaved = useCallback(() => {
    editedRef.current = false;
    clearBackup();
    setDescriptionIsDirty(false);
  }, [clearBackup, setDescriptionIsDirty]);

  useEffect(() => {
    descriptionDraftRef.current = { getUnsavedContents, markSaved, discard: clearBackup };
    return () => { descriptionDraftRef.current = null; };
  }, [descriptionDraftRef, getUnsavedContents, markSaved, clearBackup]);

  // Edits are noticed two ways: `beforeinput` events from the editor fire on
  // every keystroke, paste or delete (Lexical cancels them and applies the
  // edit itself, so plain `input` events never fire), while the form only
  // hears about changes every few seconds.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const markEdited = () => {
      editedRef.current = true;
      setDescriptionIsDirty(true);
    };
    root.addEventListener("beforeinput", markEdited);
    return () => root.removeEventListener("beforeinput", markEdited);
  }, [setDescriptionIsDirty]);
  const lastSeenContentsRef = useRef(form.state.values.contents);
  useEffect(() => form.store.subscribe(() => {
    if (form.state.values.contents !== lastSeenContentsRef.current) {
      lastSeenContentsRef.current = form.state.values.contents;
      editedRef.current = true;
    }
    if (editedRef.current) {
      setDescriptionIsDirty(hasUnsavedText());
    }
  }), [form, hasUnsavedText, setDescriptionIsDirty]);

  const save = async () => {
    setIsSaving(true);
    try {
      const contents = await getUnsavedContents();
      if (!contents) {
        // Edited, but back to the saved text: nothing to save.
        markSaved();
      } else if (await saveSequenceNow({ contents })) {
        markSaved();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const cancel = () => {
    form.reset({ contents: savedContentsRef.current });
    lastSeenContentsRef.current = form.state.values.contents;
    editedRef.current = false;
    clearBackup();
    setDescriptionIsDirty(false);
    setEditorKey((key) => key + 1);
  };

  return <div className={classes.root} ref={rootRef}>
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
