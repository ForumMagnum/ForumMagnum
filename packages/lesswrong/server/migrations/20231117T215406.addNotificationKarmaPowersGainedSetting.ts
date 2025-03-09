import { addField, dropField } from "./meta/utils";
import { Users } from '../../server/collections/users/collection';

/**
 * Generated on 2023-11-17T21:54:06.721Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/accepted_schema.sql b/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/schema_to_accept.sql
 * index f222af1bc3..7f34d0b3ec 100644
 * --- a/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 4a83029d46e8b6afd17ced17bfeb6cf7
 * -
 * --- Accepted on 2023-11-16T19:57:24.000Z by 20231116T195724.addDialogueMatchTable.ts
 * +-- Overall schema hash: cdea3c2caa55eb651988dcb30e827b07
 *  
 * @@ -1118,3 +1116,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 6adb72708a04d37a78e9a9ed4f564915
 * +-- Schema for "Users", hash: dcecbc50120238415e48392ce43148bb
 *  CREATE TABLE "Users" (
 * @@ -1200,2 +1198,3 @@ CREATE TABLE "Users" (
 *      "notificationEventInRadius" jsonb DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 * +    "notificationKarmaPowersGained" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 *      "notificationRSVPs" jsonb DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "cdea3c2caa55eb651988dcb30e827b07";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "notificationKarmaPowersGained");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "notificationKarmaPowersGained");
}
