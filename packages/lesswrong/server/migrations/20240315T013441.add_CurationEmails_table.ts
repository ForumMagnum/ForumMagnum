/**
 * Generated on 2024-03-15T01:34:41.920Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index feca4cc2cd..a2d474c516 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: ec6d12fa05425118431d110f2e216b80
 * -
 * --- Accepted on 2024-03-12T12:36:30.000Z by 20240312T123630.create_ForumEvents_table.ts
 * +-- Overall schema hash: 0171c92d85515f22e6e3499e92b1aee4
 *  
 * @@ -237,2 +235,13 @@ CREATE TABLE "CronHistories" (
 *  
 * +-- Schema for "CurationEmails", hash: 96d68c0c8e13f03b5d373b7f8f005637
 * +CREATE TABLE "CurationEmails" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "userId" text NOT NULL,
 * +    "postId" text NOT NULL,
 * +    "updatedAt" timestamptz NOT NULL,
 * +    "schemaVersion" double precision NOT NULL DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "DatabaseMetadata", hash: d05d205da4249541e524b7d8879c6e1c
 * @@ -1734 +1743,17 @@ CREATE OR REPLACE FUNCTION fm_vote_added_emoji(
 *  
 * +-- Function, hash: b0deed77e4cdaf21f56eb03d561c8455
 * +CREATE OR REPLACE FUNCTION fm_has_verified_email(emails jsonb[])
 * +    RETURNS boolean AS $$
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
export const acceptsSchemaHash = "0171c92d85515f22e6e3499e92b1aee4";

import CurationEmails from "../../lib/collections/curationEmails/collection"
import { createTable, dropTable, updateFunctions } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, CurationEmails);
  await updateFunctions(db);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, CurationEmails);
}
