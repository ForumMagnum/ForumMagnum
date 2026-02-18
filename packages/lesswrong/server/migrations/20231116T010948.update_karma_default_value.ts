/**
 * Generated on 2023-11-16T01:09:48.215Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * index bef6069ffa..5ecee1ac48 100644
 * --- a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 9993689a4229639120ef85f8531151ad
 * -
 * --- Accepted on 2023-11-08T12:22:36.000Z by 20231108T122236.ElectionCandidates_tagId_not_null.ts
 * +-- Overall schema hash: 559874dae2627ec571ac2748d5cf6bc2
 *  
 * @@ -1103,3 +1101,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: af068329774f52ec88fd989f515874db
 * +-- Schema for "Users", hash: 6adb72708a04d37a78e9a9ed4f564915
 *  CREATE TABLE "Users" (
 * @@ -1156,3 +1154,3 @@ CREATE TABLE "Users" (
 *      "lastNotificationsCheck" timestamptz,
 * -    "karma" double precision,
 * +    "karma" double precision DEFAULT 0,
 *      "goodHeartTokens" double precision,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "559874dae2627ec571ac2748d5cf6bc2";

import Users from "../../server/collections/users/collection"
import { dropDefaultValue, updateDefaultValue } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await updateDefaultValue(db, Users, "karma")
}

export const down = async ({db}: MigrationContext) => {
  await dropDefaultValue(db, Users, "karma")
}
