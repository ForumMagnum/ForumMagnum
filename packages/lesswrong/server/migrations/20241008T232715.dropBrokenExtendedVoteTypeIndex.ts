/**
 * Generated on 2024-10-08T23:27:15.786Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jbabcock/repositories/Lesserwrong/alt-LessWrong2/schema/accepted_schema.sql b/Users/jbabcock/repositories/Lesserwrong/alt-LessWrong2/schema/schema_to_accept.sql
 * index 78074223f1..41e501771f 100644
 * --- a/Users/jbabcock/repositories/Lesserwrong/alt-LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/jbabcock/repositories/Lesserwrong/alt-LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 845ab447f6646ba141b9aee88cc3a619
 * -
 * --- Accepted on 2024-10-03T15:26:17.000Z by 20241003T152617.add_postId_to_ForumEvents.ts
 * +-- Overall schema hash: 2632feebddfb9dab3164c82e2f77bdb8
 *  
 * @@ -3520,13 +3518,2 @@ CREATE INDEX IF NOT EXISTS "idx_Votes_collectionName_userId_voteType_cancelled_i
 *  
 * --- Index "idx_Votes_collectionName_userId_cancelled_isUnvote_voteType_extendedVoteType_votedAt", hash 476105560dacfd8668fc075ae714078b
 * -CREATE INDEX IF NOT EXISTS "idx_Votes_collectionName_userId_cancelled_isUnvote_voteType_extendedVoteType_votedAt" ON "Votes" USING btree (
 * -  "collectionName",
 * -  "userId",
 * -  "cancelled",
 * -  "isUnvote",
 * -  "voteType",
 * -  "extendedVoteType",
 * -  "votedAt"
 * -);
 * -
 *  -- Index "idx_Votes_documentId", hash ef0bb238a0c42d6069360b35085d9435
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "2632feebddfb9dab3164c82e2f77bdb8";

import { Votes } from "@/lib/collections/votes";
import { dropIndexByName } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await dropIndexByName(db, Votes, "idx_Votes_collectionName_userId_cancelled_isUnvote_voteType_ext");
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
