import { useEffect, useRef, useState, useCallback } from "react";
import pick from "lodash/pick";
import isEqual from "lodash/isEqual";
import { useMessages } from "@/components/common/withMessages";
import { recursivelyRemoveTypenameFrom } from "@/components/tanstack-form-components/helpers";
import type { TypedReactFormApi } from "@/components/tanstack-form-components/BaseAppForm";
import type { useMutation } from "@apollo/client/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyForm = TypedReactFormApi<any, any>;

/**
 * Fields that should NOT be auto-saved: editor-managed rich text fields,
 * display-only identifiers, and date fields that come from withDateFields
 * (those aren't in UpdateUserDataInput).
 */
export const USER_AUTOSAVE_EXCLUDE_FIELDS = new Set<string>([
  // Editor-managed (have their own save/revision pipeline)
  'biography',
  'moderationGuidelines',
  // Identifiers and display-only
  '_id',
  // Date fields added by withDateFields — not writable via updateUser
  'createdAt',
  'banned',
  'karmaChangeLastOpened',
  'lastNotificationsCheck',
  'permanentDeletionRequestedAt',
  'petrovLaunchCodeDate',
  'petrovPressedButtonDate',
  'whenConfirmationEmailSent',
  'reviewedAt',
]);

type UpdateUserMutateFn = useMutation.MutationFunction<
  updateUserUsersEditFormMutation,
  updateUserUsersEditFormMutationVariables
>;

function getInitialFieldValues(form: AnyForm): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(form.state.values).filter(([key]) => !USER_AUTOSAVE_EXCLUDE_FIELDS.has(key))
  );
}

/**
 * Auto-saves user settings fields whenever they change, mirroring the pattern
 * used by useAutoSavePostFields for the post editor. Editor-managed rich text
 * fields (biography, moderationGuidelines) are excluded and saved only on
 * explicit "Save Changes" submission.
 */
export function useAutoSaveUserFields(
  form: AnyForm,
  userId: string | undefined,
  mutate: UpdateUserMutateFn,
) {
  const { flash } = useMessages();
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const lastEnqueuedRef = useRef<Record<string, unknown>>(getInitialFieldValues(form));
  const pendingSaveRef = useRef<Record<string, unknown> | null>(null);
  const savingRef = useRef(false);
  const drainResolversRef = useRef<Array<() => void>>([]);

  const processQueue = useCallback(async () => {
    if (savingRef.current || !pendingSaveRef.current || !userId) return;

    const fields = pendingSaveRef.current;
    pendingSaveRef.current = null;
    savingRef.current = true;
    setIsSaving(true);

    try {
      const cleanedFields = recursivelyRemoveTypenameFrom(fields);
      await mutate({
        variables: {
          selector: { _id: userId },
          data: cleanedFields,
        },
      });
      setSavedAt(new Date());
    } catch {
      flash({ messageString: "Failed to auto-save settings", type: "error" });
      for (const key of Object.keys(fields)) {
        delete lastEnqueuedRef.current[key];
      }
    } finally {
      savingRef.current = false;
      if (pendingSaveRef.current) {
        void processQueue();
      } else {
        setIsSaving(false);
        for (const resolve of drainResolversRef.current) resolve();
        drainResolversRef.current = [];
      }
    }
  }, [mutate, userId, flash]);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = form.store.subscribe(() => {
      const values = form.state.values;
      const fieldMeta = form.state.fieldMeta;

      const changedKeys = Object.entries(fieldMeta)
        .filter(([key, meta]) => {
          if (!meta.isDirty || USER_AUTOSAVE_EXCLUDE_FIELDS.has(key)) return false;
          return !isEqual(values[key], lastEnqueuedRef.current[key]);
        })
        .map(([key]) => key);

      if (changedKeys.length > 0) {
        const changedFields = pick(values, changedKeys);
        Object.assign(lastEnqueuedRef.current, changedFields);
        pendingSaveRef.current = { ...(pendingSaveRef.current ?? {}), ...changedFields };
        void processQueue();
      }
    });

    return unsubscribe;
  }, [form, userId, processQueue]);

  const awaitPendingSaves = useCallback(async () => {
    if (!savingRef.current && !pendingSaveRef.current) return;
    return new Promise<void>((resolve) => {
      drainResolversRef.current.push(resolve);
    });
  }, []);

  return { isSaving, savedAt, awaitPendingSaves };
}
