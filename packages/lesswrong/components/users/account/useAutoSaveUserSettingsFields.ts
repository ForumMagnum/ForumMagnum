import { useEffect, useRef, useState, useCallback } from "react";
import pick from "lodash/pick";
import isEqual from "lodash/isEqual";
import { useMessages } from "@/components/common/withMessages";
import { recursivelyRemoveTypenameFrom } from "@/components/tanstack-form-components/helpers";
import type { EditableUser } from "@/lib/collections/users/helpers";
import type { SettingsFormApi } from "./settingsTabTypes";
import type { useMutation } from "@apollo/client/react";

/**
 * User settings fields that are toggles, notification channel controls, karma
 * notifier options, or other immediate controls — not free text, editors,
 * locations, or multiselects (those still use Save Changes).
 */
const AUTO_IMMEDIATE_SAVE_FIELD_NAMES = [
  "deleted",
  "hideProfileTopPosts",
  "commentSorting",
  "noSingleLineComments",
  "noCollapseCommentsPosts",
  "noCollapseCommentsFrontpage",
  "noKibitz",
  "sortDraftsBy",
  "hideCommunitySection",
  "showCommunityInRecentDiscussion",
  "postGlossariesPinned",
  "hideElicitPredictions",
  "hideFrontpageMap",
  "hideFrontpageBook2020Ad",
  "hideAFNonMemberInitialWarning",
  "markDownPostEditor",
  "beta",
  "hideIntercom",
  "showHideKarmaOption",
  "hideFromPeopleDirectory",
  "allowDatadogSessionReplay",
  "auto_subscribe_to_my_posts",
  "auto_subscribe_to_my_comments",
  "autoSubscribeAsOrganizer",
  "notificationSubscribedUserPost",
  "notificationSubscribedUserComment",
  "notificationCommentsOnSubscribedPost",
  "notificationSubscribedTagPost",
  "notificationSubscribedSequencePost",
  "notificationPostsInGroups",
  "notificationShortformContent",
  "notificationRepliesToMyComments",
  "notificationRepliesToSubscribedComments",
  "notificationNewMention",
  "notificationPrivateMessage",
  "notificationSharedWithMe",
  "notificationCommentsOnDraft",
  "notificationAddedAsCoauthor",
  "notificationDialogueMessages",
  "notificationPublishedDialogueMessages",
  "notificationSubforumUnread",
  "notificationAlignmentSubmissionApproved",
  "notificationEventInRadius",
  "notificationRSVPs",
  "notificationGroupAdministration",
  "karmaChangeNotifierSettings",
  "emailSubscribedToCurated",
  "unsubscribeFromAll",
  "moderationStyle",
  "moderatorAssistance",
  "collapseModerationGuidelines",
  "sunshineFlagged",
  "needsReview",
  "sunshineSnoozed",
  "noindex",
  "defaultToCKEditor",
  "hideSunshineSidebar",
  "viewUnreviewedComments",
  "postingDisabled",
  "allCommentingDisabled",
  "commentingOnOtherUsersDisabled",
  "conversationsDisabled",
  "nullifyVotes",
  "deleteContent",
  "isAdmin",
  "groups",
] as const satisfies ReadonlyArray<keyof EditableUser & string>;

const AUTO_IMMEDIATE_SAVE_FIELDS = new Set<string>(AUTO_IMMEDIATE_SAVE_FIELD_NAMES);

type UpdateUserMutateFn = useMutation.MutationFunction<
  updateUserUsersEditFormMutation,
  updateUserUsersEditFormMutationVariables
>;

function pickAutoSaveSubset(values: EditableUser): Partial<EditableUser> {
  return pick(values, AUTO_IMMEDIATE_SAVE_FIELD_NAMES);
}

function clearSavedFieldsDirtyMeta(form: SettingsFormApi, fieldKeys: string[]) {
  for (const fieldKey of fieldKeys) {
    form.setFieldMeta(fieldKey as keyof EditableUser, (prev) => ({
      ...prev,
      isDirty: false,
    }));
  }
}

/**
 * Persists toggle / select / notification-style fields as soon as they change.
 * Sequential queue: one mutation in flight; coalesces further edits after it.
 */
export function useAutoSaveUserSettingsFields(
  form: SettingsFormApi,
  userId: string | undefined,
  mutate: UpdateUserMutateFn,
  onPersisted: () => void | Promise<void>,
) {
  const { flash } = useMessages();
  const [isSaving, setIsSaving] = useState(false);

  const lastEnqueuedRef = useRef<Partial<EditableUser>>(pickAutoSaveSubset(form.state.values));

  const pendingSaveRef = useRef<Partial<EditableUser> | null>(null);
  const savingRef = useRef(false);
  const drainResolversRef = useRef<Array<() => void>>([]);

  const processQueue = useCallback(async () => {
    if (savingRef.current || !pendingSaveRef.current || !userId) return;

    const fields = pendingSaveRef.current;
    pendingSaveRef.current = null;
    savingRef.current = true;
    setIsSaving(true);

    const savedKeys = Object.keys(fields);

    try {
      const cleanedFields = recursivelyRemoveTypenameFrom(fields);
      const { data } = await mutate({
        variables: {
          selector: { _id: userId },
          data: cleanedFields,
        },
      });
      if (!data?.updateUser?.data) {
        throw new Error("Failed to update user");
      }
      clearSavedFieldsDirtyMeta(form, savedKeys);
      await onPersisted();
    } catch {
      flash({ messageString: "Failed to save changes", type: "error" });
      for (const key of savedKeys) {
        delete lastEnqueuedRef.current[key as keyof EditableUser];
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
  }, [mutate, userId, flash, form, onPersisted]);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = form.store.subscribe(() => {
      const values = form.state.values;
      const fieldMeta = form.state.fieldMeta;

      const changedKeys = Object.entries(fieldMeta)
        .filter(([key, meta]) => {
          if (!meta.isDirty || !AUTO_IMMEDIATE_SAVE_FIELDS.has(key)) return false;
          const typedKey = key as keyof EditableUser;
          return !isEqual(values[typedKey], lastEnqueuedRef.current[typedKey]);
        })
        .map(([key]) => key);

      if (changedKeys.length > 0) {
        const changedFields = pick(values, changedKeys) as Partial<EditableUser>;
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

  return { isSaving, awaitPendingSaves };
}
