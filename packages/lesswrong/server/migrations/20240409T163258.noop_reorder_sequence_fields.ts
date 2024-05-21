/**
 * Generated on 2024-04-09T16:32:58.446Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 2d6ed3fee5..1002f3141b 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,11 +4,3 @@
 *  --
 * --- Overall schema hash: ca5281426ba6c737b2621d88156ea1c6
 * -
 * --- Accepted on 2024-04-04T19:03:59.000Z by 20240404T190359.create_SideCommentCaches_table.ts
 * +-- Overall schema hash: 972b9de45fa85223bdb3e607bd8d9936
 *  
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "972b9de45fa85223bdb3e607bd8d9936";

export const up = async ({db}: MigrationContext) => {
  // This is just for reordering Sequence fields
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
