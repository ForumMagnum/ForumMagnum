import { randomId } from "@/lib/random";
import { bulkRawInsert } from "../manualMigrations/migrationUtils";
import chunk from 'lodash/chunk';

type OldBookmarkRow = {
  userId: string,
  postId: string,
  originalIndex: number,
}

type BookmarksToInsertData = Omit<DbBookmark, "schemaVersion">

export const up = async ({db}: MigrationContext) => {
  // The `bookmarkedPostsMetadata` column was later dropped, so you can't successfully run it in some github actions
  // which bootstrap from accepted_schema.sql, since it doesn't have that column anymore.  But it's necessary to run
  // if you're on an older FM instance which does still have the column.

  const columnExists = await db.oneOrNone<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'Users'
      AND column_name = 'bookmarkedPostsMetadata'
    `);

  if (!columnExists) {
    // eslint-disable-next-line no-console
    console.log("bookmarkedPostsMetadata column does not exist, skipping migration");
    return;
  }

  const oldBookmarkRows = await db.manyOrNone<OldBookmarkRow>(`
    SELECT
      u._id AS "userId",
      bookmark_element.el ->> 'postId' AS "postId",
      bookmark_element.idx AS "originalIndex"
    FROM
      "Users" u,
      LATERAL unnest(u."bookmarkedPostsMetadata") WITH ORDINALITY AS bookmark_element(el, idx)
    WHERE
      u."bookmarkedPostsMetadata" IS NOT NULL
      AND array_length(u."bookmarkedPostsMetadata", 1) > 0
      AND bookmark_element.el ? 'postId'
  `);

  const bookmarksToInsert: BookmarksToInsertData[] = [];
  const STEP_MS = 1_000;
  const EPOCH   = new Date(0);

  for (const row of oldBookmarkRows) {
    // originalIndex is 1-based. Use (originalIndex - 1) to make the first bookmark start exactly at EPOCH.
    const ts = new Date(EPOCH.getTime() + ((row.originalIndex - 1) * STEP_MS));

    bookmarksToInsert.push({
      _id: randomId(),
      userId: row.userId,
      documentId: row.postId,
      collectionName: "Posts",
      createdAt: ts,
      lastUpdated: ts,
      active: true,
    });
  }
  
  // eslint-disable-next-line no-console
  console.log(`Inserting ${bookmarksToInsert.length} bookmarks`);

  if (bookmarksToInsert.length > 0) {
    const batchSize = 10000;
    const batches = chunk(bookmarksToInsert, batchSize);

    for (const batch of batches) {
      await bulkRawInsert("Bookmarks", batch as DbBookmark[]);
    }
  }
}
