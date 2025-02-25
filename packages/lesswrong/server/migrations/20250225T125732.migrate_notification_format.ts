import Users from "@/lib/collections/users/collection";
import usersSchema, { LegacyNotificationTypeSettings, legacyToNewNotificationTypeSettings, newToLegacyNotificationTypeSettings, NotificationTypeSettings } from "@/lib/collections/users/schema";

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
  return (
    await db.any<{ userId: string }>(
      `
    SELECT DISTINCT "documentId" AS "userId"
    FROM "LWEvents"
    WHERE "name" = 'fieldChanges'
      AND properties -> 'before' ->> $1 IS NOT NULL
      AND properties -> 'after' ->> $1 IS NOT NULL
      AND properties -> 'before' ->> $1 <> properties -> 'after' ->> $1;
  `,
      [fieldName]
    )
  ).map((u) => u.userId);
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

    // TODO maybe batch these
    for (const user of usersToUpdate) {
      const oldValue = user[fieldName] as NotificationTypeSettings | LegacyNotificationTypeSettings;
      const newValue = convertFormat(oldValue);

      if (!dryRun) {
        await Users.rawUpdateOne({ _id: user._id }, { $set: { [fieldName]: newValue } })
      } else {
        console.log("Would have run rawUpdateOne with args:", { _id: user._id }, { $set: { [fieldName]: newValue } });
      }
    }

    console.log(`${!dryRun ? usersToUpdate.length : 0} users migrated`);
  }
};

export const up = async ({ db }: MigrationContext) => {
  await migrateFormat({ db, toNew: true });
};

export const down = async ({ db }: MigrationContext) => {
  await migrateFormat({ db, toNew: false });
};
