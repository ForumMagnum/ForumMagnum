import { registerMigration, fillDefaultValues } from "./migrationUtils";
import Posts from "../../lib/collections/posts/collection";

registerMigration({
  name: "fillHasCoauthorPermission",
  dateWritten: "2022-10-12",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Posts,
      fieldName: "hasCoauthorPermission",
    });
  },
});
