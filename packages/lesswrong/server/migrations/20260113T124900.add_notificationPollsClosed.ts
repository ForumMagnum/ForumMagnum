import { addField, dropField } from "./meta/utils";
import Users from "../collections/users/collection";
import {
  bothChannelsEnabledNotificationTypeSettings,
  defaultNotificationTypeSettings,
} from "@/lib/collections/users/notificationFieldHelpers";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "notificationPollClosingSoon");
  await addField(db, Users, "notificationPollClosed");

  // Backfill existing users with the correct defaults
  await Users.rawUpdateMany(
    { notificationPollClosingSoon: null },
    { $set: { notificationPollClosingSoon: bothChannelsEnabledNotificationTypeSettings } }
  );
  await Users.rawUpdateMany(
    { notificationPollClosed: null },
    { $set: { notificationPollClosed: defaultNotificationTypeSettings } }
  );
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "notificationPollClosingSoon");
  await dropField(db, Users, "notificationPollClosed");
}
