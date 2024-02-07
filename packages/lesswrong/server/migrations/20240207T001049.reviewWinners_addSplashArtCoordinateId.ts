/**
 * Generated on 2024-02-07T00:10:49.286Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * index f9069a690c..fb001df77c 100644
 * --- a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: df18ca59a89a51758424055ca12d77eb
 * -
 * --- Accepted on 2024-02-06T19:37:25.000Z by 20240206T193725.update_SplashArtCoordinates.ts
 * +-- Overall schema hash: 6e4e68a1c8e3329188c36a4fcc688f7e
 *  
 * @@ -949,3 +947,3 @@ CREATE TABLE "ReviewWinnerArts" (
 *  
 * --- Schema for "ReviewWinners", hash: b8bb1dcb23612898b93928a1a70f5c8a
 * +-- Schema for "ReviewWinners", hash: 56185f5577beb9b4a68ab00d8d988e2f
 *  CREATE TABLE "ReviewWinners" (
 * @@ -953,2 +951,3 @@ CREATE TABLE "ReviewWinners" (
 *      "postId" text NOT NULL,
 * +    "splashArtCoordinateId" text NOT NULL,
 *      "reviewYear" double precision NOT NULL,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
// export const acceptsSchemaHash = "6e4e68a1c8e3329188c36a4fcc688f7e";

// import { ReviewWinners } from '../../lib/collections/reviewWinners/collection'
// import { addField, dropField } from "./meta/utils"

// export const up = async ({db}: MigrationContext) => {
//   await addField(db, ReviewWinners, "splashArtCoordinateId")
// }

// export const down = async ({db}: MigrationContext) => {
//   await dropField(db, ReviewWinners, "splashArtCoordinateId")
// }
