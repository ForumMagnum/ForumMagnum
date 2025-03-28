import Users from "../../server/collections/users/collection";
import { triggerAutomodIfNeededForUser } from "../callbacks/sunshineCallbackUtils";
import { createAdminContext } from "../vulcan-lib/createContexts";
import { forEachDocumentBatchInCollection, registerMigration } from "./migrationUtils";

export default registerMigration({
  name: "hydrateModeratorActions",
  dateWritten: "2022-10-19",
  idempotent: true,
  action: async () => {
    const context = createAdminContext();
    await forEachDocumentBatchInCollection({
      collection: Users,
      batchSize: 1000,
      filter: { lastNotificationsCheck: { $gt: new Date('2022-06-01') } },
      callback: async (users) => {
        const userAutomodActions = await Promise.all(
          users.map(user => triggerAutomodIfNeededForUser(user, context)
        ));
      }
    });
  },
});
