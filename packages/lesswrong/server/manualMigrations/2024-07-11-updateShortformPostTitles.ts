import { userShortformPostTitle } from "@/lib/collections/users/helpers";
import { getViewablePostsSelector } from "../repos/helpers";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { registerMigration } from "./migrationUtils";
import { Posts } from "@/lib/collections/posts/collection.ts";

registerMigration({
  name: "updateShortformPostTitles",
  dateWritten: "2024-07-11",
  idempotent: true,
  action: async () => {
    const db = getSqlClientOrThrow();
    const data = await db.any(`
      SELECT u."displayName", u."shortformFeedId", p."title"
      FROM "Users" u
      JOIN "Posts" p ON
        p."_id" = u."shortformFeedId" AND
        ${getViewablePostsSelector("p")}
    `);

    const operations: MongoBulkWriteOperations<DbPost> = [];
    for (const {displayName, shortformFeedId, title} of data) {
      const newTitle = userShortformPostTitle({displayName});
      if (newTitle !== title) {
        operations.push({
          updateOne: {
            filter: {_id: shortformFeedId},
            update: {$set: {title: newTitle}},
          },
        });
      }
    }

    await Posts.rawCollection().bulkWrite(operations);
  },
});

