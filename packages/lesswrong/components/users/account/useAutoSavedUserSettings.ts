import { useCallback, useRef, useState } from 'react';
import pick from 'lodash/pick';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { useMessages } from '@/components/common/withMessages';
import { sanitizeEditableFieldValues } from '@/components/tanstack-form-components/helpers';
import { withDateFields } from '@/lib/utils/dateUtils';
import type { EditableUser } from '@/lib/collections/users/helpers';

const UserSettingsUpdateMutation = gql(`
  mutation updateUserAutoSavedSettings($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...UsersEdit
      }
    }
  }
`);

export type UserSettingsSaveResult =
  | { success: true; doc: UsersEdit }
  | { success: false; error: string };

export type UpdateUserSettings = (fields: Partial<EditableUser>) => Promise<UserSettingsSaveResult>;

/**
 * The subset of the TanStack field API that our shared form components
 * actually consume. Real TanStack fields satisfy this structurally; the
 * account-settings page constructs plain objects via `bind`.
 */
export interface UserSettingFieldBinding<T> {
  name: string;
  state: { value: T; meta: { errors: AnyBecauseHard[] } };
  handleChange: (value: T) => void;
  handleBlur: () => void;
  setValue: (value: T) => void;
}

export type BindUserSetting = <K extends keyof EditableUser & string>(name: K) => UserSettingFieldBinding<EditableUser[K]>;

export type SettingsSaveStatus = 'idle' | 'saving' | 'saved';

export function fieldUpdate<K extends keyof EditableUser>(name: K, value: EditableUser[K]): Partial<EditableUser> {
  const update: Partial<EditableUser> = {};
  update[name] = value;
  return update;
}

export function toEditableUser(user: UsersEdit): EditableUser {
  return withDateFields(user, ['banned', 'karmaChangeLastOpened', 'lastNotificationsCheck', 'permanentDeletionRequestedAt', 'petrovLaunchCodeDate', 'petrovPressedButtonDate', 'whenConfirmationEmailSent']);
}

interface PendingBatch {
  fields: Partial<EditableUser>;
  resolvers: Array<(result: UserSettingsSaveResult) => void>;
}

/**
 * State and persistence for the account-settings page. Holds the user's
 * settings as a plain object; each control commits its own field(s) through
 * `updateSettings`, which optimistically updates local state and pushes the
 * write onto a sequential per-user mutation queue. Successful saves adopt the
 * returned document, so server-side effects of the write (e.g. a displayName
 * change updating slug and previousDisplayName) are reflected. On failure the
 * error is flashed and state is reconciled from a fresh fetch when
 * `refetchUser` is available (a rejected mutation may still have written, if
 * a later callback threw), falling back to reverting the failed fields.
 */
export function useAutoSavedUserSettings(
  initialUser: EditableUser,
  refetchUser?: () => Promise<UsersEdit | null | undefined>,
) {
  const { flash } = useMessages();
  const [mutate] = useMutation(UserSettingsUpdateMutation);

  const [settings, setSettings] = useState<EditableUser>(initialUser);
  const [saveStatus, setSaveStatus] = useState<SettingsSaveStatus>('idle');

  // Values as last confirmed by the server (or initial load), used to revert
  // optimistic updates when a save fails.
  const lastSavedRef = useRef<EditableUser>(initialUser);
  const pendingRef = useRef<PendingBatch | null>(null);
  const savingRef = useRef(false);
  const savedFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processQueue = useCallback(async () => {
    if (savingRef.current || !pendingRef.current) return;

    const { fields, resolvers } = pendingRef.current;
    pendingRef.current = null;
    savingRef.current = true;
    if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
    setSaveStatus('saving');

    let result: UserSettingsSaveResult;
    try {
      const cleanedFields = sanitizeEditableFieldValues(fields, ['biography', 'moderationGuidelines']);
      const { data } = await mutate({
        variables: {
          selector: { _id: initialUser._id },
          data: cleanedFields,
        },
      });
      const doc = data?.updateUser?.data;
      if (!doc) {
        throw new Error('Failed to save changes');
      }
      // Adopt the returned document as the authoritative state, keeping any
      // newer pending values on top
      const confirmed = toEditableUser(doc);
      lastSavedRef.current = confirmed;
      setSettings(() => ({ ...confirmed, ...pendingRef.current?.fields }));
      result = { success: true, doc };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save changes';
      let reconciled = false;
      if (refetchUser) {
        try {
          const fresh = await refetchUser();
          if (fresh) {
            const confirmed = toEditableUser(fresh);
            lastSavedRef.current = confirmed;
            setSettings(() => ({ ...confirmed, ...pendingRef.current?.fields }));
            reconciled = true;
          }
        } catch {
          // Fall through to the local revert
        }
      }
      if (!reconciled) {
        // Revert the failed fields, except any that already have a newer pending value
        const failedKeys = Object.keys(fields).filter(
          (key) => !pendingRef.current || !(key in pendingRef.current.fields)
        );
        setSettings((prev) => ({ ...prev, ...pick(lastSavedRef.current, failedKeys) }));
      }
      flash({ messageString: message, type: 'error' });
      result = { success: false, error: message };
    }

    for (const resolve of resolvers) resolve(result);

    savingRef.current = false;
    if (pendingRef.current) {
      void processQueue();
    } else if (result.success) {
      setSaveStatus('saved');
      savedFadeTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500);
    } else {
      setSaveStatus('idle');
    }
  }, [mutate, initialUser._id, flash, refetchUser]);

  const updateSettings = useCallback<UpdateUserSettings>((fields) => {
    setSettings((prev) => ({ ...prev, ...fields }));
    return new Promise((resolve) => {
      pendingRef.current = {
        fields: { ...pendingRef.current?.fields, ...fields },
        resolvers: [...(pendingRef.current?.resolvers ?? []), resolve],
      };
      void processQueue();
    });
  }, [processQueue]);

  const bind = useCallback<BindUserSetting>((name) => ({
    name,
    state: { value: settings[name], meta: { errors: [] } },
    handleChange: (value) => {
      void updateSettings(fieldUpdate(name, value));
    },
    handleBlur: () => {},
    setValue: (value) => {
      void updateSettings(fieldUpdate(name, value));
    },
  }), [settings, updateSettings]);

  return { settings, updateSettings, bind, saveStatus };
}
