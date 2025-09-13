/* eslint-disable no-console */
import usersSchema from "@/lib/collections/users/newSchema";
import { NotificationTypeSettings, LegacyNotificationTypeSettings, legacyToNewNotificationTypeSettings, newToLegacyNotificationTypeSettings } from "@/lib/collections/users/notificationFieldHelpers";
import { updateDefaultValue } from "./meta/utils";
import { executePromiseQueue } from "@/lib/utils/asyncUtils";
import Users from "../collections/users/collection";
import chunk from "lodash/chunk";
import { isLW } from "@/lib/instanceSettings";

const notificationTypes = [
  "notificationCommentsOnSubscribedPost",
  "notificationShortformContent",
  "notificationRepliesToMyComments",
  "notificationRepliesToSubscribedComments",
  "notificationSubscribedUserPost",
  "notificationSubscribedUserComment",
  "notificationPostsInGroups",
  "notificationSubscribedTagPost",
  "notificationSubscribedSequencePost",
  "notificationPrivateMessage",
  "notificationSharedWithMe",
  "notificationAlignmentSubmissionApproved",
  "notificationEventInRadius",
  "notificationKarmaPowersGained",
  "notificationRSVPs",
  "notificationGroupAdministration",
  "notificationCommentsOnDraft",
  "notificationPostsNominatedReview",
  "notificationSubforumUnread",
  "notificationNewMention",
  "notificationDialogueMessages",
  "notificationPublishedDialogueMessages",
  "notificationAddedAsCoauthor",
  "notificationDebateCommentsOnSubscribedPost",
  "notificationDebateReplies",
  "notificationDialogueMatch",
  "notificationNewDialogueChecks",
  "notificationYourTurnMatchForm"
] as const;

const fetchEverChangedSettingUsers = async ({
  db,
  fieldName,
}: {
  db: SqlClient;
  fieldName: (typeof notificationTypes)[number];
}) => {

  const lwEventsUsers = !isLW() ? await db.any<{ userId: string }>(
    `
    SELECT DISTINCT "documentId" AS "userId"
    FROM "LWEvents"
    WHERE "name" = 'fieldChanges'
      AND properties -> 'before' ->> $1 IS NOT NULL
      AND properties -> 'after' ->> $1 IS NOT NULL
      AND properties -> 'before' ->> $1 <> properties -> 'after' ->> $1;
  `,
    [fieldName]
  ) : [];

  const fieldChangesUsers = await db.any<{ userId: string }>(
    `
    SELECT DISTINCT "documentId" AS "userId"
    FROM "FieldChanges"
    WHERE "fieldName" = $1
      AND "oldValue" <> "newValue";
  `,
    [fieldName]
  );

  const combinedUserIds = new Set([
    ...lwEventsUsers.map((u) => u.userId),
    ...fieldChangesUsers.map((u) => u.userId),
  ]);

  return Array.from(combinedUserIds);
};

function mergeUserNotificationDiffs(userIdsByFieldName: string[][]) {
  const mergedUserFieldChanges: Record<string, Partial<Record<typeof notificationTypes[number], true>>> = {};

  for (let i = 0; i < userIdsByFieldName.length; i++) {
    const userIds = userIdsByFieldName[i];
    const fieldName = notificationTypes[i];

    for (const userId of userIds) {
      if (!mergedUserFieldChanges[userId]) {
        mergedUserFieldChanges[userId] = {};
      }
      mergedUserFieldChanges[userId][fieldName] = true;
    }
  }

  return mergedUserFieldChanges;
}

function getAllDefaultNotificationValues(toNew: boolean) {
  const convertFormat = toNew ? legacyToNewNotificationTypeSettings : newToLegacyNotificationTypeSettings;
  return Object.fromEntries(notificationTypes.map((fieldName) => {
    // @ts-ignore we know none of the `onCreate`s require the additional fields
    const defaultValue = usersSchema[fieldName].onCreate?.({ newDocument: {} as DbUser, fieldName });
    return [fieldName, convertFormat(defaultValue)];
  }));
}

function getUpdatedNotificationValuesForUser(user: Pick<DbUser, typeof notificationTypes[number]>, toNew: boolean) {
  const convertFormat = toNew ? legacyToNewNotificationTypeSettings : newToLegacyNotificationTypeSettings;

  const newNotificationValues = Object.fromEntries(notificationTypes.map((fieldName) => {
    const oldValue = user[fieldName] as NotificationTypeSettings | LegacyNotificationTypeSettings;
    const newValue = convertFormat(oldValue);
    return [fieldName, newValue];
  }));

  return newNotificationValues;
}

const allNotificationFieldsSelector = Object.fromEntries(notificationTypes.map((fieldName) => [fieldName, 1])) as Record<typeof notificationTypes[number], 1>;

export const migrateFormat = async ({
  db,
  toNew,
  dryRun
}: {
  db: SqlClient;
  toNew: boolean;
  dryRun?: boolean; // for debugging
}) => {
  console.time("fetchEverChangedSettingUsers");

  const userChangesPromises = notificationTypes.map((fieldName) =>
    fetchEverChangedSettingUsers({ db, fieldName })
  );

  const usersWithChangesByNotificationSetting = await Promise.all(userChangesPromises);

  console.timeEnd("fetchEverChangedSettingUsers");

  const mergedUserFieldChanges = mergeUserNotificationDiffs(usersWithChangesByNotificationSetting);
  const userIdsWithChanges = Object.keys(mergedUserFieldChanges);

  const userIdsWithoutChanges = (await Users.find({ _id: { $nin: userIdsWithChanges } }, {}, { _id: 1 }).fetch()).map((user) => user._id);

  const allDefaultNotificationValues = getAllDefaultNotificationValues(toNew);

  console.log(`Updating setting for ${userIdsWithoutChanges.length} users who have never changed from the default...`);

  let batchNumber = 0;
  for (const batch of chunk(userIdsWithoutChanges, 1000)) {
    batchNumber++;
    if (!dryRun) {
      console.log(`Updating batch ${batchNumber} of ${Math.ceil(userIdsWithoutChanges.length / 1000)}...`);
      await Users.rawUpdateMany(
        { _id: { $in: batch } },
        { $set: allDefaultNotificationValues }
      );
    } else {
      console.log("Would have run rawUpdateMany with args:", { _id: { $in: batch } }, { $set: allDefaultNotificationValues });
    }
  }

  console.log("Migrating setting for users who *have* changed from the default...");

  const usersToUpdate = await Users.find({ _id: { $in: userIdsWithChanges } }, {}, { _id: 1, ...allNotificationFieldsSelector }).fetch();

  console.log(`${usersToUpdate.length} users to update`);

  // On EAF there is on the order of ~100 users for the most popular settings
  const userUpdateFuncs = usersToUpdate.map((user) => {
    return async () => {
      const updatedNotificationValues = getUpdatedNotificationValuesForUser(user, toNew);

      if (!dryRun) {
        await Users.rawUpdateOne({ _id: user._id }, { $set: updatedNotificationValues })
      } else {
        console.log("Would have run rawUpdateOne with args:", { _id: user._id }, { $set: updatedNotificationValues });
      }
    }
  });

  await executePromiseQueue(userUpdateFuncs, 10);

  console.log(`${!dryRun ? usersToUpdate.length : 0} users migrated`);
};

export const up = async ({ db }: MigrationContext) => {
  await migrateFormat({ db, toNew: true });

  // Update any defaults that have changed
  for (const type of notificationTypes) {
    await updateDefaultValue(db, Users, type);
  }
};

export const down = async ({ db }: MigrationContext) => {
  await migrateFormat({ db, toNew: false });

  // Update any defaults that have changed
  // Note: You will need to revert the schema definition to have this actually update to the previous defaults
  for (const type of notificationTypes) {
    await updateDefaultValue(db, Users, type);
  }
};
