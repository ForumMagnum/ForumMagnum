/**
 * Generated on 2024-02-06T19:37:25.630Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * index 4b5a87cef9..43d1f127d6 100644
 * --- a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: a646e49b34cd9c6338bc469c3c2430ce
 * -
 * --- Accepted on 2024-02-06T19:09:13.000Z by 20240206T190913.add_SplashArtCoordinates.ts
 * +-- Overall schema hash: df18ca59a89a51758424055ca12d77eb
 *  
 * @@ -1024,8 +1022,6 @@ CREATE TABLE "Sessions" (
 *  
 * --- Schema for "SplashArtCoordinates", hash: abf85bb5d7068255ef708f432ba178f1
 * +-- Schema for "SplashArtCoordinates", hash: 6b53aaf084d68ae95834738699fac9e0
 *  CREATE TABLE "SplashArtCoordinates" (
 *      _id varchar(27) PRIMARY KEY,
 * -    "postId" text NOT NULL,
 * -    "imageId" text NOT NULL,
 * -    "splashArtImageUrl" text,
 * +    "reviewWinnerArtId" varchar(27) NOT NULL,
 *      "logTime" timestamptz NOT NULL,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "df18ca59a89a51758424055ca12d77eb";

import { createTable, dropTable } from "./meta/utils"
import SplashArtCoordinates from "../../lib/collections/splashArtCoordinates/collection"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, SplashArtCoordinates);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, SplashArtCoordinates);
}
