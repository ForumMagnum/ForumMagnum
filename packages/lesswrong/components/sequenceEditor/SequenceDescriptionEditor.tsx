import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useEditorFormCallbacks, EditorFormComponent } from "../editor/EditorFormComponent";
import { sanitizeEditableFieldValues } from "../tanstack-form-components/helpers";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { primaryEditorButtonStyles, secondaryEditorButtonStyles } from "./editorButtonStyles";
import { useSequenceEditor } from "./SequenceEditorContext";

/**
 * The top margin matches the description's in reading mode (SequencesPage);
 * the bottom margin puts the reading-mode gap before the chapters after the
 * buttons instead. The button row keeps its height when empty, so the page
 * doesn't shift when the buttons appear.
 */
const styles = defineStyles("SequenceDescriptionEditor", (theme: ThemeType) => ({
  root: {
    marginTop: 16,
    marginBottom: 28,
  },
  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    minHeight: 36,
    marginTop: 4,
  },
  cancelButton: secondaryEditorButtonStyles(theme),
  saveButton: primaryEditorButtonStyles(theme),
}));

type DescriptionContents = SequencesEdit["contents"];

function editorText(contents: { originalContents?: { data?: string | null } | null } | null | undefined): string {
  return contents?.originalContents?.data ?? "";
}

/**
 * Tracks whether the author has changed the description since it was last
 * saved or cancelled. Loading an older (CKEditor/draftJS) description can
 * reformat it without the author changing anything, so only an actual edit
 * counts, and only when the text then differs from the saved text.
 *
 * Edits are noticed two ways: `beforeinput` events on the root element fire
 * on every keystroke, paste or delete (Lexical cancels them and applies the
 * edit itself, so plain `input` events never fire), while the form only hears
 * about changes every few seconds, when the editor copies its text in. So
 * `hasUnsavedText` can lag; callers that act on it flush the editor first.
 */
function useDescriptionEditTracking({ form, savedContentsRef, setDescriptionIsDirty }: {
  form: { state: { values: { contents: DescriptionContents } }, store: { subscribe: (listener: () => void) => () => void } },
  savedContentsRef: React.MutableRefObject<DescriptionContents>,
  setDescriptionIsDirty: (dirty: boolean) => void,
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const editedRef = useRef(false);
  const lastSeenContentsRef = useRef(form.state.values.contents);

  const hasUnsavedText = useCallback(
    () => editedRef.current && editorText(form.state.values.contents) !== editorText(savedContentsRef.current),
    [form, savedContentsRef],
  );

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

  useEffect(() => form.store.subscribe(() => {
    if (form.state.values.contents !== lastSeenContentsRef.current) {
      lastSeenContentsRef.current = form.state.values.contents;
      editedRef.current = true;
    }
    if (editedRef.current) {
      setDescriptionIsDirty(hasUnsavedText());
    }
  }), [form, hasUnsavedText, setDescriptionIsDirty]);

  const resetEdited = useCallback(() => {
    lastSeenContentsRef.current = form.state.values.contents;
    editedRef.current = false;
  }, [form]);

  return { rootRef, editedRef, hasUnsavedText, resetEdited };
}

/**
 * The sequence description, edited in place. Unlike everything else on the
 * page it doesn't save as you go: it has its own Save / Publish changes and
 * Cancel buttons, which appear once it has changed, as the account settings'
 * explicit-save fields do (ExplicitSaveTextSetting). Publish, Move to Drafts
 * and Done editing also save it (or ask about it), through the handle
 * registered in descriptionDraftRef.
 *
 * Saving with no real change just marks the description saved. Cancel resets
 * the form to the saved description (kept current as saves update the cached
 * sequence) and remounts the editor, by changing its key, to show it.
 */
const SequenceDescriptionEditor = () => {
  const classes = useStyles(styles);
  const { sequence, saveSequenceNow, descriptionDraftRef, descriptionIsDirty, setDescriptionIsDirty } = useSequenceEditor();
  const [editorKey, setEditorKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const { onSubmitCallback, onSuccessCallback, addOnSubmitCallback, addOnSuccessCallback } = useEditorFormCallbacks<SequencesEdit>();

  const form = useForm({
    defaultValues: { contents: sequence.contents },
  });

  const savedContentsRef = useRef(sequence.contents);
  savedContentsRef.current = sequence.contents;

  const { rootRef, editedRef, hasUnsavedText, resetEdited } = useDescriptionEditTracking({ form, savedContentsRef, setDescriptionIsDirty });

  const getUnsavedContents = useCallback(async () => {
    if (!editedRef.current) {
      return undefined;
    }
    await onSubmitCallback.current?.();
    if (!hasUnsavedText()) {
      return undefined;
    }
    return sanitizeEditableFieldValues({ contents: form.state.values.contents }, ["contents"]).contents ?? undefined;
  }, [form, editedRef, onSubmitCallback, hasUnsavedText]);

  const clearBackup = useCallback(() => {
    onSuccessCallback.current?.(sequence, { noReload: true });
  }, [onSuccessCallback, sequence]);

  const markSaved = useCallback(() => {
    resetEdited();
    clearBackup();
    setDescriptionIsDirty(false);
  }, [resetEdited, clearBackup, setDescriptionIsDirty]);

  useEffect(() => {
    descriptionDraftRef.current = { getUnsavedContents, markSaved, discard: markSaved };
    return () => { descriptionDraftRef.current = null; };
  }, [descriptionDraftRef, getUnsavedContents, markSaved, clearBackup]);

  const save = async () => {
    setIsSaving(true);
    try {
      const contents = await getUnsavedContents();
      if (!contents) {
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
    markSaved();
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
        hideControls
        fitToContent
      />}
    </form.Field>
    <div className={classes.buttonRow}>
      {(descriptionIsDirty || isSaving) && <>
        <button className={classes.cancelButton} disabled={isSaving} onClick={cancel}>
          Cancel
        </button>
        <button className={classes.saveButton} disabled={isSaving} onClick={save}>
          {isSaving ? "Saving…" : (sequence.draft ? "Save" : "Publish changes")}
        </button>
      </>}
    </div>
  </div>;
};

export default SequenceDescriptionEditor;
