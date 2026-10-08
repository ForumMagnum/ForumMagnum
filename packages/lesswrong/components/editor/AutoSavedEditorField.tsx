import React, { useCallback, useRef } from 'react';
import { EditorFormComponent, useEditorFormCallbacks } from '@/components/editor/EditorFormComponent';
import { fieldUpdate, type UpdateUserSettings } from '@/components/users/account/useAutoSavedUserSettings';
import type { EditableUser } from '@/lib/collections/users/helpers';

interface CommittedContents {
  type: string | null;
  data: string | null;
}

function isSameContents(a: CommittedContents, b: CommittedContents) {
  return a.type === b.type && a.data === b.data;
}

/**
 * An editor field for the account-settings page: commits the editor contents
 * through the autosave queue when focus leaves the editor, rather than on an
 * explicit form submit.
 *
 * Nothing is committed unless the contents differ from the last committed
 * contents. Before the first commit, those are the contents as the editor
 * showed them when the user first clicked or focused the field, rather than as
 * stored: an editor that loads contents stored in another format renders them
 * differently, so comparing with the stored contents would save a converted
 * copy when nothing was edited.
 */
const AutoSavedEditorField = ({
  name,
  settings,
  updateSettings,
  hintText,
  label,
}: {
  name: 'biography' | 'moderationGuidelines';
  settings: EditableUser;
  updateSettings: UpdateUserSettings;
  hintText: string;
  label?: string;
}) => {
  const {
    onSubmitCallback,
    onSuccessCallback,
    getContentsCallback,
    addOnSubmitCallback,
    addOnSuccessCallback,
    addGetContentsCallback,
  } = useEditorFormCallbacks<UsersEdit>();

  const capturedValueRef = useRef<AnyBecauseHard>(null);
  const lastCommittedRef = useRef<CommittedContents>({
    type: settings[name]?.originalContents?.type ?? null,
    data: settings[name]?.originalContents?.data ?? null,
  });
  const hasCapturedBaselineRef = useRef(false);

  const binding = {
    state: { value: settings[name] },
    setValue: (value: AnyBecauseHard) => {
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

    const newContents = {
      type: payload.originalContents?.type ?? null,
      data: payload.originalContents?.data ?? null,
    };
    const previous = lastCommittedRef.current;
    if (isSameContents(newContents, previous)) return;

    // Advance before awaiting so a repeated blur during the in-flight save
    // doesn't queue a duplicate revision
    lastCommittedRef.current = newContents;
    const result = await updateSettings(fieldUpdate(name, payload));
    if (result.success) {
      onSuccessCallback.current?.(result.doc, { noReload: true });
    } else {
      lastCommittedRef.current = previous;
    }
  }, [name, updateSettings, onSubmitCallback, onSuccessCallback, getContentsCallback]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    const focusMovedTo = e.relatedTarget instanceof Node ? e.relatedTarget : null;
    if (focusMovedTo && e.currentTarget.contains(focusMovedTo)) return;
    void commit();
  }, [commit]);

  return (
    <div onBlur={handleBlur} onFocus={handleInteraction} onPointerDown={handleInteraction}>
      <EditorFormComponent
        field={binding}
        name={name}
        formType="edit"
        document={settings}
        addOnSubmitCallback={addOnSubmitCallback}
        addOnSuccessCallback={addOnSuccessCallback}
        addGetContentsCallback={addGetContentsCallback}
        hintText={hintText}
        fieldName={name}
        collectionName="Users"
        label={label}
        commentEditor={true}
        commentStyles={true}
        hideControls={false}
      />
    </div>
  );
};

export default AutoSavedEditorField;
