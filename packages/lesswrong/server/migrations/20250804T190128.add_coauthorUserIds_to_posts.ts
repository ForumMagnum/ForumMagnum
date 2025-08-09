/* eslint-disable no-console */

import { addField, dropField, updateIndexes } from "./meta/utils"
import Posts from "../collections/posts/collection";
import BulkWriter from "../sql/BulkWriter";

export const up = async ({db}: MigrationContext) => {
  const start = new Date();

  console.log("Adding coauthorUserIds field...");
  await addField(db, Posts, "coauthorUserIds");

  console.log("Updating indexes...");
  await updateIndexes(Posts);

  console.log("Fetching posts to update...");
  const posts: {
    _id: string,
    coauthorStatuses: CoauthorStatusInput[],
  }[] = await db.any(`
    SELECT "_id", "coauthorStatuses"
    FROM "Posts"
    WHERE CARDINALITY("coauthorStatuses") > 0
  `);

  console.log(`Creating updates for ${posts.length} posts...`);
  const operations: MongoBulkWriteOperations<DbPost> = posts.map((post) => ({
    updateOne: {
      filter: {_id: post._id},
      update: {
        $set: {
          coauthorUserIds: post.coauthorStatuses!.map(({userId}) => userId),
        },
      },
    },
  }));

  console.log("Writing updates...");
  const writer = new BulkWriter(Posts.getTable(), operations);
  await writer.execute(db);

  const end = new Date();
  console.log(`Done (${end.getTime() - start.getTime()}ms)`);
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "coauthorUserIds");
  await updateIndexes(Posts);
}
