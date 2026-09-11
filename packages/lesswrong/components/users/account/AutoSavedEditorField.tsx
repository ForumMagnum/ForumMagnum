import React, { useCallback, useRef } from 'react';
import { EditorFormComponent, useEditorFormCallbacks } from '@/components/editor/EditorFormComponent';
import { fieldUpdate, type UpdateUserSettings } from './useAutoSavedUserSettings';
import type { EditableUser } from '@/lib/collections/users/helpers';

/**
 * An editor field for the account-settings page: commits the editor contents
 * through the autosave queue when focus leaves the editor, rather than on an
 * explicit form submit.
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
    addOnSubmitCallback,
    addOnSuccessCallback,
  } = useEditorFormCallbacks<UsersEdit>();

  const capturedValueRef = useRef<AnyBecauseHard>(null);
  const lastCommittedRef = useRef<{ type: string | null; data: string | null }>({
    type: settings[name]?.originalContents?.type ?? null,
    data: settings[name]?.originalContents?.data ?? null,
  });

  const binding = {
    state: { value: settings[name] },
    setValue: (value: AnyBecauseHard) => {
      capturedValueRef.current = value;
    },
    // The editor periodically echoes its contents into the field for form
    // state tracking; we only persist on commit (blur), via setValue.
    handleChange: () => {},
  };

  const commit = useCallback(async () => {
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
    if (newContents.type === previous.type && newContents.data === previous.data) return;

    // Advance before awaiting so a repeated blur during the in-flight save
    // doesn't queue a duplicate revision
    lastCommittedRef.current = newContents;
    const result = await updateSettings(fieldUpdate(name, payload));
    if (result.success) {
      onSuccessCallback.current?.(result.doc, { noReload: true });
    } else {
      lastCommittedRef.current = previous;
    }
  }, [name, updateSettings, onSubmitCallback, onSuccessCallback]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    const focusMovedTo = e.relatedTarget instanceof Node ? e.relatedTarget : null;
    if (focusMovedTo && e.currentTarget.contains(focusMovedTo)) return;
    void commit();
  }, [commit]);

  return (
    <div onBlur={handleBlur}>
      <EditorFormComponent
        field={binding}
        name={name}
        formType="edit"
        document={settings}
        addOnSubmitCallback={addOnSubmitCallback}
        addOnSuccessCallback={addOnSuccessCallback}
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
