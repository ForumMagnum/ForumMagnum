import React, { useCallback, useRef } from 'react';
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

function isSameContents(a: ContentsKey, b: ContentsKey) {
  return a.type === b.type && a.data === b.data;
}

/**
 * An editor field that saves itself when focus leaves it, rather than on an
 * explicit form submit. `onCommit` saves the contents and resolves to whether
 * the save succeeded.
 *
 * Nothing is committed unless the contents differ from the last committed
 * contents. Before the first commit, those are the contents as the editor
 * showed them when the user first clicked or focused the field, rather than as
 * stored: an editor that loads contents stored in another format renders them
 * differently, so comparing with the stored contents would save a converted
 * copy when nothing was edited.
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
    getContentsCallback,
    addOnSubmitCallback,
    addOnSuccessCallback,
    addGetContentsCallback,
  } = useEditorFormCallbacks<D>();

  const capturedValueRef = useRef<SubmittedEditorContents | null>(null);
  const lastCommittedRef = useRef<ContentsKey>(contentsKey(document[fieldName]));
  const hasCapturedBaselineRef = useRef(false);

  const binding = {
    state: { value: document[fieldName] },
    setValue: (value: SubmittedEditorContents) => {
      capturedValueRef.current = value;
    },
    // The editor echoes its contents into the field, throttled, for form
    // state tracking; we only persist on commit (blur), via setValue.
    handleChange: () => {},
  };

  // The first click or focus inside the field comes before any edit, so the
  // editor still holds the contents it loaded. If the editor isn't ready yet,
  // the stored contents stay the baseline.
  const captureBaseline = useCallback(async () => {
    if (hasCapturedBaselineRef.current) return;
    hasCapturedBaselineRef.current = true;
    const contents = await getContentsCallback.current?.();
    if (contents) {
      lastCommittedRef.current = contents;
    }
  }, [getContentsCallback]);

  const handleInteraction = useCallback(() => {
    void captureBaseline();
  }, [captureBaseline]);

  const commit = useCallback(async () => {
    // Check for a change before submitting, since submitting saves a local
    // backup that only a successful save clears
    const current = await getContentsCallback.current?.();
    if (current && isSameContents(current, lastCommittedRef.current)) return;
    if (!onSubmitCallback.current) return;
    capturedValueRef.current = null;
    await onSubmitCallback.current();
    const payload = capturedValueRef.current;
    if (!payload) return;

    const newContents = contentsKey(payload);
    const previous = lastCommittedRef.current;
    if (isSameContents(newContents, previous)) return;

    // Advance before awaiting so a repeated blur during the in-flight save
    // doesn't queue a duplicate revision
    lastCommittedRef.current = newContents;
    if (await onCommit(payload)) {
      onSuccessCallback.current?.(document, { noReload: true });
    } else {
      lastCommittedRef.current = previous;
    }
  }, [document, onCommit, onSubmitCallback, onSuccessCallback, getContentsCallback]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    const focusMovedTo = e.relatedTarget instanceof Node ? e.relatedTarget : null;
    if (focusMovedTo && e.currentTarget.contains(focusMovedTo)) return;
    void commit();
  }, [commit]);

  return (
    <div onBlur={handleBlur} onFocus={handleInteraction} onPointerDown={handleInteraction}>
      <EditorFormComponent
        field={binding}
        name={fieldName}
        formType="edit"
        document={document}
        addOnSubmitCallback={addOnSubmitCallback}
        addOnSuccessCallback={addOnSuccessCallback}
        addGetContentsCallback={addGetContentsCallback}
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
