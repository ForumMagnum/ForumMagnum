/**
 * Generated on 2024-04-04T01:14:23.820Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index b4c59ebf7e..2e56a7bb76 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 15e67a7cabc41723b3215bcb7dc9488e
 * -
 * --- Accepted on 2024-03-29T22:11:18.000Z by 20240329T221118.add_notificationSubscribedSequencePost_to_Users.ts
 * +-- Overall schema hash: 86723d78e7eb5d43201e0be72ee6f5f0
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
export const acceptsSchemaHash = "86723d78e7eb5d43201e0be72ee6f5f0";

import ArbitalCaches from "../collections/arbitalCache/collection";
import { createTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ArbitalCaches, true);
}

export const down = async ({db}: MigrationContext) => {
}
