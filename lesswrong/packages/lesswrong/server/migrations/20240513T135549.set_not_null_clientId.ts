import { ClientIds } from "../../lib/collections/clientIds/collection";
import { updateIndexes } from "./meta/utils";

/**
 * Generated on 2024-05-01T13:57:58.420Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 1be8189afd..b105cd954e 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: ce481181abda13b83244a8ccd8ed5782
 * -
 * --- Accepted on 2024-04-29T15:57:12.000Z by 20240429T155712.add_fm_get_user_by_login_token_function.ts
 * +-- Overall schema hash: 5cfcede474784a16b714db78a9f550d0
 *  
 * @@ -108,6 +106,6 @@ CREATE TABLE "CkEditorUserSessions" (
 *  
 * --- Schema for "ClientIds", hash: dfb103acdd47efe3095b6b37647334f8
 * +-- Schema for "ClientIds", hash: 3d44567eddfdfbf06900244a1788d347
 *  CREATE TABLE "ClientIds" (
 *      _id varchar(27) PRIMARY KEY,
 * -    "clientId" text,
 * +    "clientId" text NOT NULL,
 *      "firstSeenReferrer" text,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "aa1eac5798b9679483aaff7b85ba1e8e";

export const up = async ({db}: MigrationContext) => {
  await updateIndexes(ClientIds);
}

export const down = async ({db}: MigrationContext) => {}
