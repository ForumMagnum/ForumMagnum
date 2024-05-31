/**
 * Generated on 2023-05-02T16:00:34.965Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index fe9af9ce97..e4bc8d14b3 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: a85cc326da77f34b19140ca908956227
 * -
 * --- Accepted on 2023-05-02T08:32:10.000Z by 20230502T083210.add_shortformFrontpage.ts
 * +-- Overall schema hash: 5d840ee3f919bdbf70df33e470b65666
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
export const acceptsSchemaHash = "5d840ee3f919bdbf70df33e470b65666";

import Users from "../../lib/collections/users/collection"
import { BoolType } from "../../server/sql/Type";
import { addRemovedField, dropRemovedField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await dropRemovedField(db, Users, "noComicSans")
}

export const down = async ({db}: MigrationContext) => {
  await addRemovedField(db, Users, "noComicSans", new BoolType())
}
