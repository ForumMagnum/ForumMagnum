import Users from "@/lib/collections/users/collection";
import { updateDefaultValue } from "./meta/utils";

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

const updateNotificationDefaults = async (db: SqlClient) => {
  for (const type of notificationTypes) {
    await updateDefaultValue(db, Users, type);
  }
};

export const up = async ({db}: MigrationContext) => {
  await updateNotificationDefaults(db);
}

export const down = async ({db}: MigrationContext) => {
  // Note: You will need to revert the schema definition to have this actually update to the previous defaults
  await updateNotificationDefaults(db);
}
