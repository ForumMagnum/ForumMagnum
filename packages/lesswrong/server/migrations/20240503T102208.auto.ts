/**
 * Generated on 2024-05-03T10:22:08.916Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/ollieetherington/Documents/SecondForumMagnum/schema/accepted_schema.sql b/Users/ollieetherington/Documents/SecondForumMagnum/schema/schema_to_accept.sql
 * index f52de1ce81..af6aba7154 100644
 * --- a/Users/ollieetherington/Documents/SecondForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/ollieetherington/Documents/SecondForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 490c611ceed26bbc76e0c25a702d7159
 * -
 * --- Accepted on 2024-05-02T16:44:37.000Z by 20240502T164437.include_indexes_in_schema.ts
 * +-- Overall schema hash: 5f15590a8aa900ee210026b863dde23e
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
// export const acceptsSchemaHash = "5f15590a8aa900ee210026b863dde23e";

export const up = async ({db}: MigrationContext) => {
  // TODO
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
