/**
 * Generated on 2023-11-29T19:00:47.563Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * index f89a546d3f..4e8ecabad9 100644
 * --- a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,11 +4,3 @@
 *  --
 * -<<<<<<< HEAD
 * --- Overall schema hash: 133a6eae7702e8bf84919264548043a1
 * -
 * --- Accepted on 2023-11-29T01:00:45.000Z by 20231129T010045.add_four_fields_for_frontpage_dialogue_widget_customisation.ts
 * -=======
 * --- Overall schema hash: 8b861e3bf25c8edf6522b62bea9bf389
 * -
 * --- Accepted on 2023-11-29T08:07:01.000Z by 20231129T080701.add_givingSeason2023VotedFlair.ts
 * ->>>>>>> master
 * +-- Overall schema hash: 5cb40349b3ff94014c31fb0418ffa6ea
 *  
 * @@ -1139,7 +1131,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * -<<<<<<< HEAD
 * --- Schema for "Users", hash: 82b73b743a883191481c33ffcb35e08c
 * -=======
 * --- Schema for "Users", hash: 8576dcb36585985dcda87772eb597d32
 * ->>>>>>> master
 * +-- Schema for "Users", hash: a22133351267b7929fc15b858b0d5748
 *  CREATE TABLE "Users" (
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [X] Write a migration to represent these changes
 * - [X] Rename this file to something more readable
 * - [X] Uncomment `acceptsSchemaHash` below
 * - [X] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "5cb40349b3ff94014c31fb0418ffa6ea";

import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";


export const up = async ({db}: MigrationContext) => {
 await addField(db, Users, "showDialoguesList");
 await addField(db, Users, "showMyDialogues");
 await addField(db, Users, "showMatches");
 await addField(db, Users, "showRecommendedPartners");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "showDialoguesList");
  await dropField(db, Users, "showMyDialogues");
  await dropField(db, Users, "showMatches");
  await dropField(db, Users, "showRecommendedPartners");
}
