/**
 * Generated on 2023-08-21T18:07:18.881Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 689f5b435e..cc6c23363d 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 87520014b627c9ee151523bd05e7bdae
 * -
 * --- Accepted on 2023-08-18T21:54:51.000Z by 20230818T215451.post_embeddings_have_vector_type.ts
 * +-- Overall schema hash: a368523cc273895e66ea4bcc3e70f9d9
 *  
 * @@ -545,3 +543,3 @@ CREATE TABLE "PostRelations" (
 *  
 * --- Schema for "Posts", hash: 5bfebdec4ea08ba7e454089afd808c34
 * +-- Schema for "Posts", hash: 913c57af784029a0adf5dd61b01aca11
 *  CREATE TABLE "Posts" (
 * @@ -605,2 +603,3 @@ CREATE TABLE "Posts" (
 *      "podcastEpisodeId" varchar(27),
 * +    "forceAllowType3Audio" bool DEFAULT false,
 *      "legacy" bool DEFAULT false,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "1688c0a0ffbebf808f0ad26c4ba8d073";

import Posts from "../../server/collections/posts/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, "forceAllowType3Audio");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "forceAllowType3Audio");
}
