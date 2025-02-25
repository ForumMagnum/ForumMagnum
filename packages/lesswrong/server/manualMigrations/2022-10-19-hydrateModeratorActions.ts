import Users from "../../lib/collections/users/collection";
import { triggerAutomodIfNeededForUser } from "../callbacks/sunshineCallbackUtils";
import { forEachDocumentBatchInCollection, registerMigration } from "./migrationUtils";

export default registerMigration({
  name: "hydrateModeratorActions",
  dateWritten: "2022-10-19",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Users,
      batchSize: 1000,
      filter: { lastNotificationsCheck: { $gt: new Date('2022-06-01') } },
      callback: async (users) => {
        const userAutomodActions = await Promise.all(
          users.map(user => triggerAutomodIfNeededForUser(user)
        ));
      }
    });
  },
});
