import { useEffect, useRef, useState, useCallback } from "react";
import pick from "lodash/pick";
import isEqual from "lodash/isEqual";
import { useMessages } from "../common/withMessages";
import { recursivelyRemoveTypenameFrom } from "@/components/tanstack-form-components/helpers";
import type { EditablePost, PostSubmitMeta } from "@/lib/collections/posts/helpers";
import type { TypedReactFormApi } from "../tanstack-form-components/BaseAppForm";
import type { useMutation } from "@apollo/client/react";

type PostFormValues = EditablePost & { title: string };

/**
 * Fields that should NOT be auto-saved. Either they have their own save
 * mechanism, are editor-managed, or are display-only fields not on
 * UpdatePostDataInput.
 */
const EXCLUDE_FIELDS = new Set<string>([
  // Editor-managed (have their own save/revision pipeline)
  'contents', 'customHighlight', 'moderationGuidelines',
  // Only changed on explicit Publish / Save Draft
  'draft',
  // Has its own save-on-blur in EditTitle
  'title',
  // Display-only fields on EditablePost that aren't part of UpdatePostDataInput
  '_id', 'tags', 'socialPreviewData', 'user', 'commentCount', 'afCommentCount', 'debate',
]);

type UpdatePostMutateFn = useMutation.MutationFunction<
  updatePostPostFormMutation,
  updatePostPostFormMutationVariables
>;

function getInitialFieldValues(form: TypedReactFormApi<PostFormValues, PostSubmitMeta>): Partial<PostFormValues> {
  return Object.fromEntries(
    Object.entries(form.state.values).filter(([key]) => !EXCLUDE_FIELDS.has(key))
  ) as Partial<PostFormValues>;
}

/**
 * Auto-saves post metadata fields (everything except editor contents and draft
 * status) whenever they change. Uses a sequential queue so that at most one
 * save is in-flight at a time, and any changes that arrive while a save is
 * running are saved immediately after it completes.
 */
export function useAutoSavePostFields(
  form: TypedReactFormApi<PostFormValues, PostSubmitMeta>,
  postId: string | undefined,
  mutate: UpdatePostMutateFn,
) {
  const { flash } = useMessages();
  const [isSaving, setIsSaving] = useState(false);

  // Track what values we've already enqueued (or initialized with) so we
  // don't enqueue redundant saves while one is in-flight. Initialized from
  // the form's current values so we don't immediately try to save unchanged fields.
  const lastEnqueuedRef = useRef<Partial<PostFormValues>>(getInitialFieldValues(form));

  // Simple queue: at most one pending save waiting behind the in-flight one.
  const pendingSaveRef = useRef<Partial<PostFormValues> | null>(null);
  const savingRef = useRef(false);
  // Resolvers waiting for the queue to drain (used by awaitPendingSaves)
  const drainResolversRef = useRef<Array<() => void>>([]);

  const processQueue = useCallback(async () => {
    if (savingRef.current || !pendingSaveRef.current || !postId) return;

    const fields = pendingSaveRef.current;
    pendingSaveRef.current = null;
    savingRef.current = true;
    setIsSaving(true);

    try {
      const cleanedFields = recursivelyRemoveTypenameFrom(fields);
      await mutate({
        variables: {
          selector: { _id: postId },
          data: cleanedFields,
        },
      });
    } catch (error) {
      flash({ messageString: "Failed to save changes", type: "error" });
      // Remove from lastEnqueued so a future change can retry
      for (const key of Object.keys(fields) as Array<keyof PostFormValues>) {
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
  }, [mutate, postId, flash]);

  // Subscribe to form store changes and enqueue saves for dirty non-excluded
  // fields whose values have changed.
  useEffect(() => {
    if (!postId) return;

    const unsubscribe = form.store.subscribe(() => {
      const values = form.state.values;
      const fieldMeta = form.state.fieldMeta;

      const changedKeys = Object.entries(fieldMeta)
        .filter(([key, meta]) => {
          if (!meta.isDirty || EXCLUDE_FIELDS.has(key)) return false;
          const typedKey = key as keyof PostFormValues;
          return !isEqual(values[typedKey], lastEnqueuedRef.current[typedKey]);
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
  }, [form, postId, processQueue]);

  /**
   * Returns a promise that resolves when all in-flight and pending saves have
   * completed. Call this before a manual form submission to ensure consistency.
   */
  const awaitPendingSaves = useCallback(async () => {
    if (!savingRef.current && !pendingSaveRef.current) return;
    return new Promise<void>((resolve) => {
      drainResolversRef.current.push(resolve);
    });
  }, []);

  return { isSaving, awaitPendingSaves };
}
