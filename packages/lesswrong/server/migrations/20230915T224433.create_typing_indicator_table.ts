/**
 * Generated on 2023-09-15T22:44:33.217Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/accepted_schema.sql b/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/schema_to_accept.sql
 * index c8e4597509..00806809a6 100644
 * --- a/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/accepted_schema.sql
 * +++ b/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 1688c0a0ffbebf808f0ad26c4ba8d073
 * -
 * --- Accepted on 2023-09-14T09:41:48.000Z by 20230914T094148.add_forceAllowType3Audio.ts
 * +-- Overall schema hash: c7d6d21198c4725672bcea289b5c32ff
 *  
 * @@ -968,2 +966,13 @@ CREATE TABLE "Tags" (
 *  
 * +-- Schema for "TypingIndicators", hash: b1ca958f9f88cd30add34274d4f97cb1
 * +CREATE TABLE "TypingIndicators" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "userId" text NOT NULL,
 * +    "documentId" text NOT NULL,
 * +    "lastUpdated" timestamptz NOT NULL,
 * +    "schemaVersion" double precision DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "UserActivities", hash: 0ab5700d352f6273e9a280dca6d864d5
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "c7d6d21198c4725672bcea289b5c32ff";

import TypingIndicator from "../../lib/collections/typingIndicators/collection";
import { createTable, dropTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, TypingIndicator);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, TypingIndicator);
}
