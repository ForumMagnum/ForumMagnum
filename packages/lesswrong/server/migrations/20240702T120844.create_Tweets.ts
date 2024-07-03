/**
 * Generated on 2024-06-25T17:33:30.638Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 32226208fe..bf60ac59c1 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: c1dd7ed968b6af5a78625296b5e5fec0
 * -
 * --- Accepted on 2024-06-12T17:35:25.000Z by 20240612T173525.add_onsite_digest_background_fields.ts
 * +-- Overall schema hash: 451f624e992044e17b6301c3f571ee04
 *  
 * @@ -2749,2 +2747,15 @@ CREATE INDEX IF NOT EXISTS "idx_Tags_parentTagId" ON "Tags" USING btree ("parent
 *  
 * +-- Table "Tweets", hash 778437461a4d5935997a8efbe420fa66
 * +CREATE TABLE "Tweets" (
 * +  _id VARCHAR(27) PRIMARY KEY,
 * +  "postId" TEXT,
 * +  "content" TEXT NOT NULL,
 * +  "schemaVersion" DOUBLE PRECISION NOT NULL DEFAULT 1,
 * +  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +  "legacyData" JSONB
 * +);
 * +
 * +-- Index "idx_Tweets_schemaVersion", hash 41a33ff99c5c8dcfd994b0d297da58df
 * +CREATE INDEX IF NOT EXISTS "idx_Tweets_schemaVersion" ON "Tweets" USING btree ("schemaVersion");
 * +
 *  -- Table "TypingIndicators", hash b97ae11df17abd3e2fceb7427d545963
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "a43d70aa333497e5911f91e0e60c2115";

import Tweets from "@/lib/collections/tweets/collection";
import { createTable, dropTable, updateIndexes } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, Tweets);
  await updateIndexes(Tweets);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, Tweets)
}
