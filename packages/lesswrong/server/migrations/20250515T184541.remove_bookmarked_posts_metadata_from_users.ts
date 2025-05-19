import { Users } from '../collections/users/collection';
import { dropField } from './meta/utils';
import { randomId } from "@/lib/random"; // For new bookmark IDs
import { bulkRawInsert } from "../manualMigrations/migrationUtils"; // For inserting new bookmarks
import chunk from 'lodash/chunk'; // For batching inserts

interface UserBookmarkMetaRow {
  userId: string;
  postId: string;
  idx: number; // Original 1-based index from the metadata array
}

interface CollectionBookmarkRow {
  userId: string;
  documentId: string;
}

// Copied from 20250503T011345.migrate_user_bookmarks_to_collection.ts
// Assuming DbBookmark is globally available or this Omit<> structure is sufficient for bulkRawInsert's needs
type BookmarksToInsertData = Omit<DbBookmark, "schemaVersion">

export async function up({ db }: MigrationContext): Promise<void> {
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

  // eslint-disable-next-line no-console
  console.log("Starting migration: remove_bookmarked_posts_metadata_from_users (up)");

  // 1. Fetch User Bookmarks from Metadata (Set A) including original index
  const userMetadataBookmarks = await db.manyOrNone<UserBookmarkMetaRow>(`
    SELECT
      u._id AS "userId",
      bookmark_element.el ->> 'postId' AS "postId",
      bookmark_element.idx AS "idx"  -- Get the 1-based ordinality
    FROM
      "Users" u,
      LATERAL unnest(u."bookmarkedPostsMetadata") WITH ORDINALITY AS bookmark_element(el, idx)
    WHERE
      u."bookmarkedPostsMetadata" IS NOT NULL
      AND array_length(u."bookmarkedPostsMetadata", 1) > 0
      AND bookmark_element.el ? 'postId'
  `);
  // eslint-disable-next-line no-console
  console.log(`Found ${userMetadataBookmarks.length} potential postId entries in Users.bookmarkedPostsMetadata.`);

  // 2. Fetch Bookmarks from Bookmarks Collection (Set B)
  const collectionBookmarks = await db.manyOrNone<CollectionBookmarkRow>(`
    SELECT
      b."userId",
      b."documentId"
    FROM
      "Bookmarks" b
    WHERE
      b."collectionName" = 'Posts'
  `);
  // eslint-disable-next-line no-console
  console.log(`Found ${collectionBookmarks.length} 'Posts' bookmarks in the Bookmarks collection.`);

  const bookmarksSet = new Set(
    collectionBookmarks.map(b => `${b.userId}::${b.documentId}`)
  );

  // 3. Identify Missing Bookmarks
  const missingBookmarksToCreate: BookmarksToInsertData[] = [];
  const EPOCH = new Date(0);
  const STEP_MS = 1000;

  if (userMetadataBookmarks.length > 0) {
    for (const metaBookmark of userMetadataBookmarks) {
      if (!metaBookmark.postId || !metaBookmark.userId) {
        // eslint-disable-next-line no-console
        console.warn(`Skipping malformed metadata entry: ${JSON.stringify(metaBookmark)}`);
        continue;
      }
      const key = `${metaBookmark.userId}::${metaBookmark.postId}`;
      if (!bookmarksSet.has(key)) {
        // This bookmark is in metadata but not in the Bookmarks collection. Prepare to insert it.
        // originalIndex (idx) is 1-based.
        const ts = new Date(EPOCH.getTime() + ((metaBookmark.idx - 1) * STEP_MS));
        missingBookmarksToCreate.push({
          _id: randomId(),
          userId: metaBookmark.userId,
          documentId: metaBookmark.postId,
          collectionName: "Posts",
          createdAt: ts,
          lastUpdated: ts,
          active: true,
        });
      }
    }
  }

  // 4. Prepare and Insert Missing Bookmarks
  if (missingBookmarksToCreate.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`Identified ${missingBookmarksToCreate.length} missing bookmarks to insert into Bookmarks collection.`);
    const batchSize = 10000;
    const batches = chunk(missingBookmarksToCreate, batchSize);

    for (const batch of batches) {
      await bulkRawInsert("Bookmarks", batch as DbBookmark[]);
    }
    // eslint-disable-next-line no-console
    console.log(`Successfully inserted ${missingBookmarksToCreate.length} missing bookmarks.`);
  } else {
    // eslint-disable-next-line no-console
    console.log("No missing bookmarks identified from user metadata.");
  }

  // eslint-disable-next-line no-console
  console.log("Proceeding to drop 'bookmarkedPostsMetadata' field from Users table.");
  await dropField(db, Users, 'bookmarkedPostsMetadata');
  // eslint-disable-next-line no-console
  console.log("'bookmarkedPostsMetadata' field dropped successfully.");

  // eslint-disable-next-line no-console
  console.log("Migration remove_bookmarked_posts_metadata_from_users (up) completed.");
}
