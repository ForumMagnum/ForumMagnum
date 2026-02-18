/**
 * Generated on 2023-06-16T17:07:16.519Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 0714701648..85869376b5 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 7abdde9662fea7114e47457ccdc6f4ad
 * -
 * --- Accepted on 2023-06-14T18:28:37.000Z by 20230614T182837.add_digest_tables.ts
 * +-- Overall schema hash: 88bc10e632764af3e6cff68763da9113
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
export const acceptsSchemaHash = "88bc10e632764af3e6cff68763da9113";

import Posts from "../../server/collections/posts/collection"
import Tags from "../../server/collections/tags/collection";
import { BoolType } from "../sql/Type";
import { addRemovedField, dropRemovedField, updateDefaultValue } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addRemovedField(db, Posts, 'criticismTipsDismissed', new BoolType())
  await updateDefaultValue(db, Tags, "autoTagModel")
  await updateDefaultValue(db, Tags, "autoTagPrompt")
}

export const down = async ({db}: MigrationContext) => {
  await dropRemovedField(db, Posts, 'criticismTipsDismissed')
  await updateDefaultValue(db, Tags, "autoTagModel")
  await updateDefaultValue(db, Tags, "autoTagPrompt")
}
