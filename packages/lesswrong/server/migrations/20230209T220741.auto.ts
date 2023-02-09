/**
 * Generated on 2023-02-09T22:07:41.958Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index d73179b811..91621ba2b0 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,11 +4,3 @@
 *  --
 * -<<<<<<< HEAD
 * --- Overall schema hash: 391eb72da4ed19587803f9f11866a75d
 * -
 * --- Accepted on 2023-02-07T20:45:40.000Z by 20230207T204540.auto.ts
 * -=======
 * --- Overall schema hash: a7887d09050fb7d8f7117f498534d322
 * -
 * --- Accepted on 2023-02-08T17:44:49.000Z by 20230208T174449.add_shortName.ts
 * ->>>>>>> master
 * +-- Overall schema hash: dbc3a1a821f459ad60e85420d4c287c0
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
export const acceptsSchemaHash = "dbc3a1a821f459ad60e85420d4c287c0";

export const up = async ({db}: MigrationContext) => {
  // TODO
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
