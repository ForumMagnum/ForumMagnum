/* eslint-disable no-console */
import usersSchema, { LegacyNotificationTypeSettings, legacyToNewNotificationTypeSettings, newToLegacyNotificationTypeSettings, NotificationTypeSettings } from "@/lib/collections/users/schema";
import { updateDefaultValue } from "./meta/utils";
import { executePromiseQueue } from "@/lib/utils/asyncUtils";
import Users from "../collections/users/collection";

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
  const lwEventsUsers = await db.any<{ userId: string }>(
    `
    SELECT DISTINCT "documentId" AS "userId"
    FROM "LWEvents"
    WHERE "name" = 'fieldChanges'
      AND properties -> 'before' ->> $1 IS NOT NULL
      AND properties -> 'after' ->> $1 IS NOT NULL
      AND properties -> 'before' ->> $1 <> properties -> 'after' ->> $1;
  `,
    [fieldName]
  );

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

const migrateFormat = async ({
  db,
  toNew,
  dryRun
}: {
  db: SqlClient;
  toNew: boolean;
  dryRun?: boolean; // for debugging
}) => {
  const convertFormat = toNew ? legacyToNewNotificationTypeSettings : newToLegacyNotificationTypeSettings;

  console.time("fetchEverChangedSettingUsers");

  const userChangesPromises = notificationTypes.map((fieldName) =>
    fetchEverChangedSettingUsers({ db, fieldName })
  );

  const usersWithChangesByNotificationSetting = await Promise.all(userChangesPromises);

  console.timeEnd("fetchEverChangedSettingUsers");

  for (let i = 0; i < usersWithChangesByNotificationSetting.length; i++) {
    const fieldName = notificationTypes[i];
    const usersEverChangedSetting = usersWithChangesByNotificationSetting[i];
    console.log(`Field: ${fieldName}, Number of users who have ever changed setting: ${usersEverChangedSetting.length}`);

    // @ts-ignore we know none of the `onCreate`s require the additional fields
    const newDefault = convertFormat(usersSchema[fieldName].onCreate?.({ newDocument: {} as DbUser, fieldName }));

    console.log("Updating setting for users who have never changed from the default...");
    if (!dryRun) {
      await Users.rawUpdateMany(
        { _id: { $nin: usersEverChangedSetting } },
        { $set: { [fieldName]: newDefault } }
      );
    } else {
      console.log("Would have run rawUpdateMany with args:", { _id: { $nin: usersEverChangedSetting } }, { $set: { [fieldName]: newDefault } });
    }

    console.log("Migrating setting for users who *have* changed from the default...");

    const usersToUpdate = await Users.find(
      { _id: { $in: usersEverChangedSetting } },
      {},
      { _id: 1, [fieldName]: 1 }
    ).fetch();

    // On EAF there is on the order of ~100 users for the most popular settings
    const userUpdateFuncs = usersToUpdate.map((user) => {
      return async () => {
        const oldValue = user[fieldName] as NotificationTypeSettings | LegacyNotificationTypeSettings;
        const newValue = convertFormat(oldValue);

        if (!dryRun) {
          await Users.rawUpdateOne({ _id: user._id }, { $set: { [fieldName]: newValue } })
        } else {
          console.log("Would have run rawUpdateOne with args:", { _id: user._id }, { $set: { [fieldName]: newValue } });
        }
      }
    })
    await executePromiseQueue(userUpdateFuncs, 10);

    console.log(`${!dryRun ? usersToUpdate.length : 0} users migrated`);
  }
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
