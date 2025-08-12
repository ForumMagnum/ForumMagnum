// Set to true to test the counts without actually deleting anything
const DRY_RUN = false;

export const up = async ({db}: MigrationContext) => {
  // List of collections where there were any matching ReadStatuses based on a query
  // of the EAF prod database
  const collectionsToClean = [
    'Users',
    'Comments',
    'Tags',
    'AdvisorRequests',
    'Reports',
    'Localgroups',
    'DigestPosts',
    'Sequences',
    'Chapters',
    'ElectionVotes',
    'UserMostValuablePosts',
    'UserTagRels',
    'Digests',
    'ElectionCandidates',
    'CommentModeratorActions',
    'TagFlags',
    'Collections',
    'UserRateLimits',
    'Books'
  ];

  console.log(`Starting ${DRY_RUN ? 'DRY RUN' : 'LIVE'} cleanup of invalid ReadStatuses...`);

  let totalToDelete = 0;

  for (const collectionName of collectionsToClean) {
    const countResult = await db.one(`
      SELECT COUNT(*) as count
      FROM "ReadStatuses" rs
      LEFT JOIN "${collectionName}" t ON rs."postId" = t._id
      WHERE t._id IS NOT NULL
    `);

    const count = parseInt(countResult.count);

    if (count > 0) {
      console.log(`Found ${count} invalid ReadStatuses pointing to ${collectionName}`);
      totalToDelete += count;

      if (DRY_RUN) {
        console.log(`DRY RUN: Would delete ${count} ReadStatuses pointing to ${collectionName}`);
      } else {
        const deleteResult = await db.result(`
          DELETE FROM "ReadStatuses"
          WHERE _id IN (
            SELECT rs._id
            FROM "ReadStatuses" rs
            LEFT JOIN "${collectionName}" t ON rs."postId" = t._id
            WHERE t._id IS NOT NULL
          )
        `);

        const deletedCount = deleteResult.rowCount;
        console.log(`Deleted ${deletedCount} invalid ReadStatuses pointing to ${collectionName}`);
      }
    } else {
      console.log(`No invalid ReadStatuses found pointing to ${collectionName}`);
    }
  }

  if (DRY_RUN) {
    console.log(`DRY RUN complete. Would delete ${totalToDelete} invalid ReadStatuses total`);
    console.log('Set DRY_RUN = false in the migration file to actually perform the deletion');
  } else {
    console.log(`Cleanup complete. Total deleted: ${totalToDelete} invalid ReadStatuses`);
  }
}

export const down = async ({db}: MigrationContext) => {
  console.log('This migration cannot be reversed - invalid ReadStatuses have been permanently deleted');
}
