import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useEditorFormCallbacks, EditorFormComponent } from "../editor/EditorFormComponent";
import { type ContentsKey, contentsKey, isSameContents } from "../editor/AutoSavedEditorField";
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

/**
 * Tracks whether the description differs from its baseline: what the editor
 * held before the author's first edit, or what was last saved. The baseline is
 * read from the editor rather than taken from the stored description, since an
 * editor that loads an older (CKEditor/draftJS) description can hold it in a
 * different form without the author changing anything.
 *
 * `captureBaseline` runs in the capture phase of the author's first focus,
 * click, key press, paste or drop in the editor, so the editor's contents are
 * read before it applies the edit. If the editor isn't ready yet, the next
 * interaction tries again. A change that comes before any baseline was read is
 * compared with the stored description instead.
 *
 * `handleEditorChange` is called on every change to the editor's contents,
 * however it was made (typing, Enter, paste, the toolbar), and updates the
 * page's unsaved flag. The form value is only updated every few seconds, so it
 * isn't used.
 */
function useDescriptionChangeTracking({ getContentsCallback, savedContentsRef, setDescriptionIsDirty }: {
  getContentsCallback: React.RefObject<(() => Promise<ContentsKey | null>) | null>,
  savedContentsRef: React.RefObject<DescriptionContents>,
  setDescriptionIsDirty: (dirty: boolean) => void,
}) {
  const baselineRef = useRef<Promise<ContentsKey | null> | null>(null);
  const changedBeforeBaselineRef = useRef(false);
  const latestDirtyCheckRef = useRef(0);

  const captureBaseline = useCallback(() => {
    if (baselineRef.current || changedBeforeBaselineRef.current) return;
    const contents = getContentsCallback.current?.();
    if (!contents) return;
    const baseline = contents.then((value) => {
      if (!value && baselineRef.current === baseline) {
        baselineRef.current = null;
      }
      return value;
    });
    baselineRef.current = baseline;
  }, [getContentsCallback]);

  const getBaseline = useCallback(async (): Promise<ContentsKey | null> => {
    const captured = baselineRef.current ? await baselineRef.current : null;
    if (captured) return captured;
    return changedBeforeBaselineRef.current ? contentsKey(savedContentsRef.current) : null;
  }, [savedContentsRef]);

  const hasChanged = useCallback(async () => {
    const current = await getContentsCallback.current?.();
    const baseline = await getBaseline();
    return !!current && !!baseline && !isSameContents(current, baseline);
  }, [getContentsCallback, getBaseline]);

  const refreshDirty = useCallback(async () => {
    const check = ++latestDirtyCheckRef.current;
    const dirty = await hasChanged();
    if (check === latestDirtyCheckRef.current) {
      setDescriptionIsDirty(dirty);
    }
  }, [hasChanged, setDescriptionIsDirty]);

  const handleEditorChange = useCallback(() => {
    if (!baselineRef.current) {
      changedBeforeBaselineRef.current = true;
    }
    void refreshDirty();
  }, [refreshDirty]);

  const setBaseline = useCallback((baseline: ContentsKey | null) => {
    baselineRef.current = baseline ? Promise.resolve(baseline) : null;
    changedBeforeBaselineRef.current = false;
  }, []);

  const clearDirty = useCallback(() => {
    ++latestDirtyCheckRef.current;
    setDescriptionIsDirty(false);
  }, [setDescriptionIsDirty]);

  return { captureBaseline, hasChanged, refreshDirty, handleEditorChange, setBaseline, clearDirty };
}

/**
 * The sequence description, edited in place. Unlike everything else on the
 * page it doesn't save as you go: it has its own Save / Publish changes and
 * Cancel buttons, which appear once it has changed, as the account settings'
 * explicit-save fields do (ExplicitSaveTextSetting). Publish, Move to Drafts
 * and Done editing also save it (or ask about it), through the handle
 * registered in descriptionDraftRef.
 *
 * Once a save succeeds, what was saved becomes the baseline, so text typed
 * while the save was in flight still counts as unsaved. Saving with no real
 * change just clears the unsaved flag. Cancel resets the form to the saved
 * description (kept current as saves update the cached sequence) and remounts
 * the editor, by changing its key, to show it.
 */
const SequenceDescriptionEditor = () => {
  const classes = useStyles(styles);
  const { sequence, saveSequenceNow, descriptionDraftRef, descriptionIsDirty, setDescriptionIsDirty } = useSequenceEditor();
  const [editorKey, setEditorKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const {
    onSubmitCallback,
    onSuccessCallback,
    getContentsCallback,
    addOnSubmitCallback,
    addOnSuccessCallback,
    addGetContentsCallback,
  } = useEditorFormCallbacks<SequencesEdit>();

  const form = useForm({
    defaultValues: { contents: sequence.contents },
  });

  const savedContentsRef = useRef(sequence.contents);
  savedContentsRef.current = sequence.contents;

  const {
    captureBaseline,
    hasChanged,
    refreshDirty,
    handleEditorChange,
    setBaseline,
    clearDirty,
  } = useDescriptionChangeTracking({ getContentsCallback, savedContentsRef, setDescriptionIsDirty });

  const getUnsavedContents = useCallback(async () => {
    if (!await hasChanged()) {
      return undefined;
    }
    await onSubmitCallback.current?.();
    return sanitizeEditableFieldValues({ contents: form.state.values.contents }, ["contents"]).contents ?? undefined;
  }, [form, hasChanged, onSubmitCallback]);

  const clearBackup = useCallback(() => {
    onSuccessCallback.current?.(sequence, { noReload: true });
  }, [onSuccessCallback, sequence]);

  const markSaved = useCallback((saved: CreateRevisionDataInput) => {
    setBaseline(contentsKey(saved));
    clearBackup();
    void refreshDirty();
  }, [setBaseline, clearBackup, refreshDirty]);

  const markUnchanged = useCallback(() => {
    clearBackup();
    clearDirty();
  }, [clearBackup, clearDirty]);

  useEffect(() => {
    descriptionDraftRef.current = { getUnsavedContents, markSaved, discard: markUnchanged };
    return () => { descriptionDraftRef.current = null; };
  }, [descriptionDraftRef, getUnsavedContents, markSaved, markUnchanged]);

  const save = async () => {
    setIsSaving(true);
    try {
      const contents = await getUnsavedContents();
      if (!contents) {
        markUnchanged();
      } else if (await saveSequenceNow({ contents })) {
        markSaved(contents);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const cancel = () => {
    form.reset({ contents: savedContentsRef.current });
    setBaseline(null);
    markUnchanged();
    setEditorKey((key) => key + 1);
  };

  return <div className={classes.root}>
    <div
      onFocusCapture={captureBaseline}
      onPointerDownCapture={captureBaseline}
      onKeyDownCapture={captureBaseline}
      onPasteCapture={captureBaseline}
      onDropCapture={captureBaseline}
    >
      <form.Field name="contents">
        {(field) => <EditorFormComponent
          key={editorKey}
          field={field}
          name="contents"
          formType="edit"
          document={{ ...sequence, contents: form.state.values.contents }}
          addOnSubmitCallback={addOnSubmitCallback}
          addOnSuccessCallback={addOnSuccessCallback}
          addGetContentsCallback={addGetContentsCallback}
          onBlankStateChange={handleEditorChange}
          hintText="Add a description…"
          fieldName="contents"
          collectionName="Sequences"
          commentEditor={false}
          commentStyles={false}
          hideControls
          fitToContent
        />}
      </form.Field>
    </div>
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
