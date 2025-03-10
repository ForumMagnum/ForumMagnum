import { getSqlClientOrThrow } from "../../server/sql/sqlClient";
import { registerMigration } from "./migrationUtils";

export default registerMigration({
  name: "fixUnsubmittedFrontpagePosts",
  dateWritten: "2024-05-06",
  idempotent: true,
  action: async () => {
    await getSqlClientOrThrow().none(`
      UPDATE "Posts"
      SET "frontpageDate" = NULL
      WHERE
        "submitToFrontpage" IS NOT TRUE AND
        "frontpageDate" IS NOT NULL AND
        "draft" IS NOT TRUE
    `);
  },
});
