/**
 * Generated on 2023-05-22T22:03:40.688Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/accepted_schema.sql b/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/schema_to_accept.sql
 * index 67a226c12b..e1fc34094d 100644
 * --- a/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/accepted_schema.sql
 * +++ b/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 922ce375a3ed4de843e0f4f9cc50dd08
 * -
 * --- Accepted on 2023-05-14T10:46:40.000Z by 20230514T104640.add_voteReceivedCounts.ts
 * +-- Overall schema hash: 63f9eaa9871d535c5e55aaf42d037925
 *  
 * @@ -374,3 +372,3 @@ CREATE TABLE "Migrations" (
 *  
 * --- Schema for "ModerationTemplates", hash: 9196d1b41d3f019964f297bec50b3934
 * +-- Schema for "ModerationTemplates", hash: 061a6912094aa8492a987a5b130c550b
 *  CREATE TABLE "ModerationTemplates" (
 * @@ -379,3 +377,3 @@ CREATE TABLE "ModerationTemplates" (
 *      "collectionName" text,
 * -    "order" double precision DEFAULT 0,
 * +    "order" double precision DEFAULT 10,
 *      "deleted" bool DEFAULT false,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "63f9eaa9871d535c5e55aaf42d037925";

import { ModerationTemplates } from "../../lib/collections/moderationTemplates"
import { updateDefaultValue } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (ModerationTemplates.isPostgres()) {
    await updateDefaultValue(db, ModerationTemplates, "order")
  }
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
