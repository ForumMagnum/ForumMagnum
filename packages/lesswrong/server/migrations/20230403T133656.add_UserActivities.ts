/**
 * Generated on 2023-03-23T10:15:04.007Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 163e7eae5d..99c12fa9d2 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -6,4 +6,2 @@
 *  
 * --- Accepted on 2023-03-16T11:58:16.000Z by 20230316T115816.add_UserActivities.ts
 * -
 *  -- Schema for "AdvisorRequests", hash: 7d8b2c2f86db29368d55481bc888c1d9
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "15f268cf3b83c45ac5fd4486bf050b18";

export const up = async ({db}: MigrationContext) => {
  // noop because this migration is done in packages/lesswrong/server/manualMigrations/2023-03-16-createUserActivities.ts
  // (because of a bootstrapping issue)
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
