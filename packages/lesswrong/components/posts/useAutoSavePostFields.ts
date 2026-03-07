import { useEffect, useRef, useState, useCallback } from "react";
import { useMessages } from "../common/withMessages";
import { recursivelyRemoveTypenameFrom } from "@/components/tanstack-form-components/helpers";
import type { EditablePost, PostSubmitMeta } from "@/lib/collections/posts/helpers";
import type { TypedReactFormApi } from "../tanstack-form-components/BaseAppForm";

/**
 * Fields that should NOT be auto-saved. Either they have their own save
 * mechanism, are editor-managed, or are display-only fields not on
 * UpdatePostDataInput.
 */
const EXCLUDE_FIELDS = new Set([
  // Editor-managed (have their own save/revision pipeline)
  'contents', 'customHighlight', 'moderationGuidelines',
  // Only changed on explicit Publish / Save Draft
  'draft',
  // Has its own save-on-blur in EditTitle
  'title',
  // Display-only fields on EditablePost that aren't part of UpdatePostDataInput
  '_id', 'tags', 'socialPreviewData', 'user', 'commentCount', 'afCommentCount', 'debate',
]);

type UpdatePostMutateFn = (options: { variables: { selector: { _id: string }, data: AnyBecauseHard } }) => Promise<unknown>;

function getInitialFieldValues(form: TypedReactFormApi<EditablePost & { title: string }, PostSubmitMeta>) {
  const result: Record<string, unknown> = {};
  const values = form.state.values as Record<string, unknown>;
  for (const key of Object.keys(values)) {
    if (!EXCLUDE_FIELDS.has(key)) {
      result[key] = values[key];
    }
  }
  return result;
}

/**
 * Auto-saves post metadata fields (everything except editor contents and draft
 * status) whenever they change. Uses a sequential queue so that at most one
 * save is in-flight at a time, and any changes that arrive while a save is
 * running are saved immediately after it completes.
 */
export function useAutoSavePostFields(
  form: TypedReactFormApi<EditablePost & { title: string }, PostSubmitMeta>,
  postId: string | undefined,
  mutate: UpdatePostMutateFn,
) {
  const { flash } = useMessages();
  const [isSaving, setIsSaving] = useState(false);

  // Track what values we've already enqueued (or initialized with) so we
  // don't enqueue redundant saves while one is in-flight. Initialized from
  // the form's current values so we don't immediately try to save unchanged fields.
  const lastEnqueuedRef = useRef(getInitialFieldValues(form));

  // Simple queue: at most one pending save waiting behind the in-flight one.
  const pendingSaveRef = useRef<Record<string, unknown> | null>(null);
  const savingRef = useRef(false);
  // Resolvers waiting for the queue to drain (used by awaitPendingSaves)
  const drainResolversRef = useRef<Array<() => void>>([]);

  const processQueue = useCallback(async () => {
    if (savingRef.current || !pendingSaveRef.current) return;

    const fields = pendingSaveRef.current;
    pendingSaveRef.current = null;
    savingRef.current = true;
    setIsSaving(true);

    try {
      const cleanedFields = recursivelyRemoveTypenameFrom(fields as JsonRecord);
      await mutate({
        variables: {
          selector: { _id: postId! },
          data: cleanedFields,
        },
      });
    } catch (error) {
      flash({ messageString: "Failed to save changes", type: "error" });
      // Remove from lastEnqueued so a future change can retry
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
  }, [mutate, postId, flash]);

  // Subscribe to form store changes and enqueue saves for dirty non-excluded
  // fields whose values have changed.
  useEffect(() => {
    if (!postId) return;

    const unsubscribe = form.store.subscribe(() => {
      const values = form.state.values as Record<string, unknown>;
      const fieldMeta = form.state.fieldMeta as Record<string, { isDirty?: boolean }>;

      const changedFields: Record<string, unknown> = {};

      for (const [key, meta] of Object.entries(fieldMeta)) {
        if (!meta.isDirty || EXCLUDE_FIELDS.has(key)) continue;
        const currentVal = values[key];
        if (currentVal !== lastEnqueuedRef.current[key]) {
          changedFields[key] = currentVal;
        }
      }

      if (Object.keys(changedFields).length > 0) {
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
