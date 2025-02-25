/**
 * Generated on 2024-06-11T18:25:02.140Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index 50e73768bc..507abe3d89 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 6fc595baf02ccdf4ffdf8777a5981d32
 * -
 * --- Accepted on 2024-05-26T11:13:08.000Z by 20240526T111308.set_not_null_clientId_2.ts
 * +-- Overall schema hash: 6916cc5096e4eeee5bc92639da67e9fa
 *  
 * @@ -2149,2 +2147,5 @@ CREATE INDEX IF NOT EXISTS "idx_posts_positiveReviewVoteCountReviewCount" ON "Po
 *  
 * +-- Index "idx_Posts_userId_postedAt", hash d8224ae89d7828438f4123ff5704a0cf
 * +CREATE INDEX IF NOT EXISTS "idx_Posts_userId_postedAt" ON "Posts" USING btree ("userId", "postedAt");
 * +
 *  -- Index "idx_posts_alignmentSuggestedPosts", hash f7917caf6fb7b57ed255a6c2127a3d27
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "6916cc5096e4eeee5bc92639da67e9fa";

import { Posts } from "@/lib/collections/posts/collection.ts"
import { updateIndexes } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await updateIndexes(Posts);
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
