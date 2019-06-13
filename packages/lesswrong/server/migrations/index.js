// Convention: Migration scripts (starting from when this migration
// infrastructure was put in place) live in this directory (server/migrations),
// and are named "YYYY-MM-DD-migrationDescription.js", with the date when the
// script was written.

import './2019-01-04-voteSchema';
import './2019-01-21-denormalizeVoteCount';
import './2019-01-24-karmaChangeSettings';
import './2019-01-30-migrateEditableFields'
import './2019-02-04-testCommentMigration'
import './2019-02-04-addSchemaVersionEverywhere'
import './2019-02-04-replaceObjectIdsInEditableFields'
import './2019-02-06-fixBigPosts'
import './2019-02-14-computeWordCounts'
import './2019-03-07-schemaMismatchFixes1'
import './2019-03-21-fixDeletedBios'
import './2019-04-10-confirmLegacyEmails'
import './2019-04-10-dropObsoleteColumns'
import './2019-04-10-legacyDataCollection'
import './2019-04-24-migrateLinkPosts'
import './2019-05-09-denormalizeReadStatus'
import './2019-05-14-fixCapitalizedSlugs'
import './2019-06-03-updateMessageCounts'
import './2019-06-13-renameAllPostsSorting'
