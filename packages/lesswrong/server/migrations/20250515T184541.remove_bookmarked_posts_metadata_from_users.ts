import { Users } from '../collections/users/collection';
import { dropField } from './meta/utils';

interface UserBookmarkMetaRow {
  userId: string;
  postId: string;
}

interface CollectionBookmarkRow {
  userId: string;
  documentId: string;
}

export async function up({ db }: MigrationContext): Promise<void> {
  // eslint-disable-next-line no-console
  console.log("Starting migration: remove_bookmarked_posts_metadata_from_users (up)");

  // 1. Fetch User Bookmarks from Metadata (Set A)
  const userMetadataBookmarks = await db.manyOrNone<UserBookmarkMetaRow>(`
    SELECT
      u._id AS "userId",
      bookmark_element.el ->> 'postId' AS "postId"
    FROM
      "Users" u,
      LATERAL unnest(u."bookmarkedPostsMetadata") AS bookmark_element(el)
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

  // 3. Compare A and B: Find discrepancies
  const discrepancies: string[] = [];
  if (userMetadataBookmarks.length > 0) {
    for (const metaBookmark of userMetadataBookmarks) {
      if (!metaBookmark.postId || !metaBookmark.userId) {
        console.warn(`Skipping malformed metadata entry: ${JSON.stringify(metaBookmark)}`);
        continue;
      }
      const key = `${metaBookmark.userId}::${metaBookmark.postId}`;
      if (!bookmarksSet.has(key)) {
        discrepancies.push(
          `Discrepancy: User ${metaBookmark.userId}, PostId ${metaBookmark.postId} found in metadata but not as bookmark in Bookmarks collection.`
        );
      }
    }
  }

  // 4. Conditional Field Drop
  if (discrepancies.length === 0) {
    // eslint-disable-next-line no-console
    console.log("No discrepancies found for users with bookmarkedPostsMetadata. Proceeding to drop 'bookmarkedPostsMetadata' field from Users table.");
    await dropField(db, Users, 'bookmarkedPostsMetadata');
    // eslint-disable-next-line no-console
    console.log("'bookmarkedPostsMetadata' field dropped successfully.");
  } else {
    // eslint-disable-next-line no-console
    console.warn(`Found ${discrepancies.length} discrepancies. 'bookmarkedPostsMetadata' field will NOT be dropped.`);
    throw new Error(
      `Found ${discrepancies.length} discrepancies. 'bookmarkedPostsMetadata' field will NOT be dropped.`,
      { cause: new Error(discrepancies.join('\n')) }
    );
  }

  // eslint-disable-next-line no-console
  console.log("Migration remove_bookmarked_posts_metadata_from_users (up) completed.");
}
