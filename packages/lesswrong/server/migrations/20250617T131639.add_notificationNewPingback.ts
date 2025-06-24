import { addField, dropField } from "./meta/utils";
import Users from "../collections/users/collection";
import { isEAForum } from "@/lib/instanceSettings";
import { emailEnabledNotificationSettingOnCreate } from "@/lib/collections/users/notificationFieldHelpers";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "notificationNewPingback");
  if (isEAForum) {
    await Users.rawUpdateMany({}, {
      $set: {
        notificationNewPingback: emailEnabledNotificationSettingOnCreate,
      },
    });
  }
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "notificationNewPingback");
}
