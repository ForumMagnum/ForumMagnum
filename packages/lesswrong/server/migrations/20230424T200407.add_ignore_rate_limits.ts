import { Posts } from "../../server/collections/posts/collection";
import { addField, dropField } from "./meta/utils";

/**
 * Generated on 2023-04-24T20:04:07.169Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/accepted_schema.sql b/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/schema_to_accept.sql
 * index 559df24b0e..6904b09a27 100644
 * --- a/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/accepted_schema.sql
 * +++ b/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 1058503cdf3522b15f94b3499566433a
 * -
 * --- Accepted on 2023-04-13T18:46:26.000Z by 20230413T184626.add_rejected_reasons_fields.ts
 * +-- Overall schema hash: c4afbf05797c266012f5ba5ae0119c87
 *  
 * @@ -464,3 +462,3 @@ CREATE TABLE "PostRelations" (
 *  
 * --- Schema for "Posts", hash: f4ca610b780ee8fc503c04e05fd7a646
 * +-- Schema for "Posts", hash: 1c137ff08da3554ca53a4d51251c143e
 *  CREATE TABLE "Posts" (
 * @@ -592,2 +590,3 @@ CREATE TABLE "Posts" (
 *      "moderationStyle" text,
 * +    "ignoreRateLimits" bool,
 *      "hideCommentKarma" bool DEFAULT false,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "c4afbf05797c266012f5ba5ae0119c87";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, 'ignoreRateLimits')
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, 'ignoreRateLimits')
}
