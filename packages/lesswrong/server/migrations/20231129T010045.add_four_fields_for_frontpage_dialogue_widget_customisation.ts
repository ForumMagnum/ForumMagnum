/**
 * Generated on 2023-11-29T01:00:45.575Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * index 5681788c4f..109c995d31 100644
 * --- a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 7db476f93913b50f646a44166768ced6
 * -
 * --- Accepted on 2023-11-28T15:23:04.000Z by 20231128T152304.add_ElectionVotes.ts
 * +-- Overall schema hash: 133a6eae7702e8bf84919264548043a1
 *  
 * @@ -1537 +1535,2 @@ CREATE OR REPLACE FUNCTION fm_comment_confidence(
 *    ;
 * +
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [X] Write a migration to represent these changes
 * - [X] Rename this file to something more readable
 * - [X] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "133a6eae7702e8bf84919264548043a1";

import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";


export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
   await addField(db, Users, "showDialoguesList");
   await addField(db, Users, "showMyDialogues");
   await addField(db, Users, "showMatches");
   await addField(db, Users, "showRecommendedPartners");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "showDialoguesList");
    await dropField(db, Users, "showMyDialogues");
    await dropField(db, Users, "showMatches");
    await dropField(db, Users, "showRecommendedPartners");
  }
}
