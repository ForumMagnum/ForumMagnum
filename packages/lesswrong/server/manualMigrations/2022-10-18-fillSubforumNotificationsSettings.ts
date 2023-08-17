import { registerMigration, fillDefaultValues } from "./migrationUtils";
import UserTagRels from "../../lib/collections/userTagRels/collection";
import Users from "../../lib/collections/users/collection";

registerMigration({
  name: "fillSubforumNotificationsSettings",
  dateWritten: "2022-10-12",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: UserTagRels,
      fieldName: "subforumShowUnreadInSidebar",
    });
    await fillDefaultValues({
      collection: UserTagRels,
      fieldName: "subforumEmailNotifications",
    });
    await fillDefaultValues({
      collection: Users,
      fieldName: "notificationSubforumUnread",
    });
  },
});
