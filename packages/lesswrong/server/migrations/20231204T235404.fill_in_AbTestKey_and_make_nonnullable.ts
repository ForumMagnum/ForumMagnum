/**
 * Generated on 2023-12-04T23:54:04.542Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * index 8ee762712e..864432999d 100644
 * --- a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 2d5747e2acdbe83c754cbbda258623ed
 * -
 * --- Accepted on 2023-12-01T02:27:44.000Z by 20231201T022744.add_field_for_hiding_specific_users_in_reciprocity.ts
 * +-- Overall schema hash: 2ace126a36fc6b5cdb4e4a0264fec6f9
 *  
 * @@ -1135,3 +1133,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 8b90207b4966ab3b80cf95db6cc89bc2
 * +-- Schema for "Users", hash: 6d9a5b1e2c860d1fd9c689e33e2e7a6f
 *  CREATE TABLE "Users" (
 * @@ -1306,3 +1304,3 @@ CREATE TABLE "Users" (
 *      "tagRevisionCount" double precision DEFAULT 0,
 * -    "abTestKey" text,
 * +    "abTestKey" text NOT NULL,
 *      "abTestOverrides" jsonb,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "2ace126a36fc6b5cdb4e4a0264fec6f9";

export const up = async ({db}: MigrationContext) => {
  await db.none(`
    UPDATE "Users"
    SET
      "abTestKey" = _id
    WHERE "abTestKey" IS NULL;

    ALTER TABLE "Users"
      ALTER COLUMN "abTestKey" SET NOT NULL;
  `)
}

export const down = async ({db}: MigrationContext) => {
  await db.none(`
    ALTER TABLE "Users"
      ALTER COLUMN "abTestKey" DROP NOT NULL;
  `)
}


