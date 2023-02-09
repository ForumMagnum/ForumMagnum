/**
 * Generated on 2023-02-07T20:45:40.735Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index bba391c134..47b7bc2938 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: c4ad9670df04a3753f9e2db9bb5bade8
 * -
 * --- Accepted on 2023-01-31T23:26:42.000Z by 20230131T232642.add_showCommunityInRecentDiscussion_user_field.ts
 * +-- Overall schema hash: 391eb72da4ed19587803f9f11866a75d
 *  
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "391eb72da4ed19587803f9f11866a75d";

export const up = async ({db}: MigrationContext) => {
  // TODO
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
