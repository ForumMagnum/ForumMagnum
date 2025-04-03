/**
 * Generated on 2024-09-30T21:52:49.991Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index ddfc718677..e6d16060a1 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -6,4 +6,2 @@
 *  
 * --- Accepted on 2024-09-25T02:00:54.000Z by 20240925T020054.create_petrovDayAction.ts
 * -
 *  -- Extension "btree_gin", hash 7b207eefbb36f8109cca31911e6ab886
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "4176699fcd50a096b6fd2437aec71b01";

import Posts from "@/server/collections/posts/collection";
import { addRemovedField, dropRemovedField } from "./meta/utils";
import { BoolType } from "../sql/Type";

export const up = async ({db}: MigrationContext) => {
  await dropRemovedField(db, Posts, 'criticismTipsDismissed')
}

export const down = async ({db}: MigrationContext) => {
  await addRemovedField(db, Posts, 'criticismTipsDismissed', new BoolType())
}

