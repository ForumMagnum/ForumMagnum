import { registerMigration, fillDefaultValues } from "./migrationUtils";
import UserTagRels from "../../server/collections/userTagRels/collection";
import Users from "../../server/collections/users/collection";

export default registerMigration({
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
