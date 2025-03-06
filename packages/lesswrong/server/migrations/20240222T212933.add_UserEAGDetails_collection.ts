/**
 * Generated on 2024-02-22T21:29:33.175Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 76ef015cd0..5c400d9689 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 92b57599e36ee19757a1e763216509c5
 * -
 * --- Accepted on 2024-02-13T22:27:00.000Z by 20240213T222700.add_notificationSubscribedUserComment_to_Users.ts
 * +-- Overall schema hash: c88a556fe6f1bc2d5ce4f08149eb3388
 *
 * @@ -1153,2 +1151,18 @@ CREATE TABLE "UserActivities" (
 *
 * +-- Schema for "UserEAGDetails", hash: ec7725c3606058c6d76c36742c0ed260
 * +CREATE TABLE "UserEAGDetails" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "userId" varchar(27) NOT NULL,
 * +    "careerStage" text[],
 * +    "countryOrRegion" text,
 * +    "nearestCity" text,
 * +    "willingnessToRelocate" jsonb,
 * +    "experiencedIn" text[],
 * +    "interestedIn" text[],
 * +    "lastUpdated" timestamptz NOT NULL,
 * +    "schemaVersion" double precision NOT NULL DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "UserJobAds", hash: cbe262a3b5b91e45d97e57a62c0e7b6a
 *
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "c88a556fe6f1bc2d5ce4f08149eb3388";
import UserEAGDetails from "@/lib//lib/collections/userEAGDetails/collection";
import { createTable, dropTable } from "@/lib/server/migrations/meta/utils";
export const up = async ({ db }: MigrationContext) => {
    await createTable(db, UserEAGDetails);
};
export const down = async ({ db }: MigrationContext) => {
    await dropTable(db, UserEAGDetails);
};
