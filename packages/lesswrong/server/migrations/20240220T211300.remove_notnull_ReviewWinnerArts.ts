/**
 * Generated on 2024-02-20T21:13:00.637Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * index 51c0b36165..2ff7a0519b 100644
 * --- a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: c474d685fecb4d58a3d23e9d419f859a
 * -
 * --- Accepted on 2024-02-15T20:32:45.000Z by 20240215T203245.add_ReviewWinnerArts_SplashArtCoordinates.ts
 * +-- Overall schema hash: 5943dd3f9d3cd8c97a6ec7bc3c11384f
 *  
 * @@ -938,6 +936,6 @@ CREATE TABLE "ReviewVotes" (
 *  
 * --- Schema for "ReviewWinnerArts", hash: cf5627337e282ca622a5f1870187c3a1
 * +-- Schema for "ReviewWinnerArts", hash: 74b127dba36d96bc39e851faf37d0fe4
 *  CREATE TABLE "ReviewWinnerArts" (
 *      _id varchar(27) PRIMARY KEY,
 * -    "postId" text NOT NULL,
 * +    "postId" text,
 *      "splashArtImagePrompt" text NOT NULL,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "5943dd3f9d3cd8c97a6ec7bc3c11384f";

export const up = async ({db}: MigrationContext) => {
  // TODO
  await db.none(`ALTER TABLE "ReviewWinnerArts" 
    ALTER COLUMN "postId" DROP NOT NULL`
  )
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
