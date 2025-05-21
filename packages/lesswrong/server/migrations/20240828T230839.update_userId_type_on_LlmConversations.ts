import LlmConversations from "@/server/collections/llmConversations/collection";
import { updateFieldType } from "./meta/utils";

/**
 * Generated on 2024-08-28T23:08:39.282Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * index 255a3886ea..f8277ff076 100644
 * --- a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: e4f656b97627c2f035fdee90d49cb5dc
 * -
 * --- Accepted on 2024-08-27T18:52:18.000Z by 20240827T185218.create_LlmConversationsAndMessages_tables.ts
 * +-- Overall schema hash: 3da0f2961c017b248168aeaa90955305
 *  
 * @@ -1011,6 +1009,6 @@ CREATE INDEX IF NOT EXISTS "idx_LegacyData_objectId" ON "LegacyData" USING btree
 *  
 * --- Table "LlmConversations", hash 49ad4e83777890bde1310b0ad82b8ac7
 * +-- Table "LlmConversations", hash 03a8cf07edc23d431ebc8f65e688296b
 *  CREATE TABLE "LlmConversations" (
 *    _id VARCHAR(27) PRIMARY KEY,
 * -  "userId" TEXT NOT NULL,
 * +  "userId" VARCHAR(27) NOT NULL,
 *    "title" TEXT NOT NULL,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "3da0f2961c017b248168aeaa90955305";

export const up = async ({db}: MigrationContext) => {
  await updateFieldType(db, LlmConversations, "userId");
}

