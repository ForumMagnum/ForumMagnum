/**
 * Generated on 2023-11-16T03:01:05.763Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * index 98a308bc1e..e59336018d 100644
 * --- a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 9c5c042b46b51d1c32bfe30cad147c81
 * -
 * --- Accepted on 2023-11-16T02:23:04.000Z by 20231116T022304.add_DialogueMatchPreferences_table.ts
 * +-- Overall schema hash: 13ea31a8ea022bd548a408cc2d9c13ec
 *  
 * @@ -1118,3 +1116,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 6adb72708a04d37a78e9a9ed4f564915
 * +-- Schema for "Users", hash: 7390e6a3a50f1dc30a8af5355e92dd55
 *  CREATE TABLE "Users" (
 * @@ -1215,2 +1213,3 @@ CREATE TABLE "Users" (
 *      "optedInToDialogueFacilitation" bool NOT NULL DEFAULT false,
 * +    "optedInToDialogueFacilitationOrCheckedAnyBoxes" bool NOT NULL DEFAULT false,
 *      "karmaChangeNotifierSettings" jsonb DEFAULT '{"updateFrequency":"daily","timeOfDayGMT":11,"dayOfWeekGMT":"Saturday","showNegativeKarma":false}' ::jsonb,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [X] Write a migration to represent these changes
 * - [X] Rename this file to something more readable
 * - [X] Uncomment `acceptsSchemaHash` below
 * - [X] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "13ea31a8ea022bd548a408cc2d9c13ec";

import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";


export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, "optedInToDialogueFacilitationOrCheckedAnyBoxes");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "optedInToDialogueFacilitationOrCheckedAnyBoxes");
  }
}
