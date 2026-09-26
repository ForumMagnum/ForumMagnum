import React, { useCallback, useEffect, useRef } from 'react';
import { EditorFormComponent, useEditorFormCallbacks } from '@/components/editor/EditorFormComponent';

interface EditorContentsValue {
  originalContents?: { type?: string | null; data?: string | null } | null;
}

/** The value the editor submits for its field: its contents, plus editor metadata. */
export type SubmittedEditorContents = EditorContentsValue & { originalContents: { type: string; data: string } };

interface ContentsKey {
  type: string | null;
  data: string | null;
}

function contentsKey(contents: EditorContentsValue | null | undefined): ContentsKey {
  return {
    type: contents?.originalContents?.type ?? null,
    data: contents?.originalContents?.data ?? null,
  };
}

/**
 * An editor field that saves itself when focus leaves it, rather than on an
 * explicit form submit. `onCommit` saves the contents and resolves to whether
 * the save succeeded.
 *
 * Only real edits are committed. The editor's output can differ from the
 * stored contents it loaded (older formats are converted), so the baseline
 * for "unchanged" is the editor's own first echo of its contents into the
 * field (`handleChange`), which it normally sends before the author types:
 * on load or when first focused. If the author types before that echo (the
 * editor reports input through `beforeinput` events, since Lexical cancels
 * them and applies the edit itself), the stored contents are the baseline
 * instead, so the edit isn't mistaken for the starting point. Until either
 * happens there is nothing to save. A commit captures the contents through
 * the binding's `setValue`, and contents equal to the baseline aren't saved. The baseline advances to the committed
 * contents before the save is awaited, so a second blur during an in-flight
 * save doesn't queue a duplicate revision.
 */
const AutoSavedEditorField = <D extends { _id: string }, F extends keyof D & string>({
  document,
  fieldName,
  collectionName,
  hintText,
  label,
  commentEditor,
  commentStyles,
  hideControls,
  fitToContent,
  onCommit,
}: {
  document: D & Record<F, EditorContentsValue | null | undefined>;
  fieldName: F;
  collectionName: CollectionNameString;
  hintText: string;
  label?: string;
  commentEditor: boolean;
  commentStyles: boolean;
  hideControls: boolean;
  fitToContent?: boolean;
  onCommit: (contents: SubmittedEditorContents) => Promise<boolean>;
}) => {
  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback,
  } = useEditorFormCallbacks<D>();

  const capturedValueRef = useRef<SubmittedEditorContents | null>(null);
  const lastCommittedRef = useRef<ContentsKey | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const noteInputBeforeFirstEcho = () => {
      lastCommittedRef.current ??= contentsKey(document[fieldName]);
    };
    root.addEventListener("beforeinput", noteInputBeforeFirstEcho);
    return () => root.removeEventListener("beforeinput", noteInputBeforeFirstEcho);
  }, [document, fieldName]);

  const binding = {
    state: { value: document[fieldName] },
    setValue: (value: SubmittedEditorContents) => {
      capturedValueRef.current = value;
    },
    handleChange: (value: SubmittedEditorContents) => {
      lastCommittedRef.current ??= contentsKey(value);
    },
  };

  const commit = useCallback(async () => {
    if (!lastCommittedRef.current || !onSubmitCallback.current) return;
    capturedValueRef.current = null;
    await onSubmitCallback.current();
    const payload = capturedValueRef.current;
    if (!payload) return;

    const newContents = contentsKey(payload);
    const previous = lastCommittedRef.current;
    if (newContents.type === previous.type && newContents.data === previous.data) return;

    lastCommittedRef.current = newContents;
    if (await onCommit(payload)) {
      onSuccessCallback.current?.(document, { noReload: true });
    } else {
      lastCommittedRef.current = previous;
    }
  }, [document, onCommit, onSubmitCallback, onSuccessCallback]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    const focusMovedTo = e.relatedTarget instanceof Node ? e.relatedTarget : null;
    if (focusMovedTo && e.currentTarget.contains(focusMovedTo)) return;
    void commit();
  }, [commit]);

  return (
    <div onBlur={handleBlur} ref={rootRef}>
      <EditorFormComponent
        field={binding}
        name={fieldName}
        formType="edit"
        document={document}
        addOnSubmitCallback={addOnSubmitCallback}
        addOnSuccessCallback={addOnSuccessCallback}
        hintText={hintText}
        fieldName={fieldName}
        collectionName={collectionName}
        label={label}
        commentEditor={commentEditor}
        commentStyles={commentStyles}
        hideControls={hideControls}
        fitToContent={fitToContent}
      />
    </div>
  );
};

export default AutoSavedEditorField;
