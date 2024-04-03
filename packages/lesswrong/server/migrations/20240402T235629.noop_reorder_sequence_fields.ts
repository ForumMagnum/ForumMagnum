/**
 * Generated on 2024-04-02T23:56:29.223Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 321d8a25dd..edca552e39 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 3b10e788a0f9632efcf3636b3fc70fd1
 * -
 * --- Accepted on 2024-04-02T16:52:15.000Z by 20240402T165215.noop_reorder_sequence_fields.ts
 * +-- Overall schema hash: cdfce4cb2385285db26aeebe1939ef2b
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
export const acceptsSchemaHash = "cdfce4cb2385285db26aeebe1939ef2b";

export const up = async ({db}: MigrationContext) => {
  // This is just for reordering Sequence fields
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
