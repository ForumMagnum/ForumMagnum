/**
 * Generated on 2023-06-08T23:35:07.710Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jonathanmustin/cea/EAForum/schema/accepted_schema.sql b/Users/jonathanmustin/cea/EAForum/schema/schema_to_accept.sql
 * index e445addda3..5d4c8d40b8 100644
 * --- a/Users/jonathanmustin/cea/EAForum/schema/accepted_schema.sql
 * +++ b/Users/jonathanmustin/cea/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 6e28f55ed0de0da2c75b4284178ba6e1
 * -
 * --- Accepted on 2023-06-08T20:45:14.000Z by 20230608T204514.add_reactPaletteStyle.ts
 * +-- Overall schema hash: d13edf9438e52690d052f92c3c06e3df
 *  
 * @@ -906,2 +904,15 @@ CREATE TABLE "UserActivities" (
 *  
 * +-- Schema for "UserLists", hash: 472e32a5e6c4b04fd101fd457aef4ec4
 * +CREATE TABLE "UserLists" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "name" text,
 * +    "memberIds" text[] DEFAULT '{}' ::text[],
 * +    "userId" varchar(27),
 * +    "description" jsonb,
 * +    "description_latest" text,
 * +    "schemaVersion" double precision DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "UserMostValuablePosts", hash: 18360b12e30e6c11cf29b03a02112707
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "d13edf9438e52690d052f92c3c06e3df";

import UserLists from "../../lib/collections/userLists/collection"
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (UserLists.isPostgres()) {
    await createTable(db, UserLists)
  }
}

export const down = async ({db}: MigrationContext) => {
  if (UserLists.isPostgres()) {
    await dropTable(db, UserLists);
  }
}
