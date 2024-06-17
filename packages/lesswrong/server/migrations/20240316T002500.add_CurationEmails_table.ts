/**
 * Generated on 2024-03-16T00:25:00.724Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index 2dd1585323..e849c6a283 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 01bf8045d376a34b6a5c7d0d8bfddcaa
 * -
 * --- Accepted on 2024-03-12T18:57:36.000Z by 20240312T185736.add_inactiveSurveyEmailSentAt_to_Users.ts
 * +-- Overall schema hash: 5fb909476a7c6ef9567f7efb1abd005f
 *  
 * @@ -237,2 +235,12 @@ CREATE TABLE "CronHistories" (
 *  
 * +-- Schema for "CurationEmails", hash: 2b0de558a2fbb70cb5713fa5b7076862
 * +CREATE TABLE "CurationEmails" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "userId" text NOT NULL,
 * +    "postId" text NOT NULL,
 * +    "schemaVersion" double precision NOT NULL DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "DatabaseMetadata", hash: d05d205da4249541e524b7d8879c6e1c
 * @@ -1735 +1743,17 @@ CREATE OR REPLACE FUNCTION fm_vote_added_emoji(
 *  
 * +-- Function, hash: 321634e71748effc28132b851408fb4c
 * +CREATE OR REPLACE FUNCTION fm_has_verified_email(emails jsonb[])
 * +    RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $$
 * +    DECLARE
 * +      item jsonb;
 * +    BEGIN
 * +      FOR item IN SELECT unnest(emails)
 * +      LOOP
 * +        IF (item->>'verified')::boolean THEN
 * +          RETURN true;
 * +        END IF;
 * +      END LOOP;
 * +      RETURN false;
 * +    END;
 * +  $$;
 * +
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "5fb909476a7c6ef9567f7efb1abd005f";

import CurationEmails from "../../lib/collections/curationEmails/collection"
import { createTable, dropTable, updateFunctions } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, CurationEmails);
  await updateFunctions(db);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, CurationEmails);
}
