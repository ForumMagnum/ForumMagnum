/**
 * Generated on 2023-03-06T18:25:40.252Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/accepted_schema.sql b/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/schema_to_accept.sql
 * index 1e7ead6503..4db575321b 100644
 * --- a/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: c938b8b04e3c61dec2f0b640b6cb0b4d
 * -
 * --- Accepted on 2023-02-23T11:56:02.000Z by 20230223T115602.DebouncerEvents_pendingEvents_string_array.ts
 * +-- Overall schema hash: dc774f8734d7cc069d913d351d4225b8
 *  
 * @@ -69,3 +67,3 @@ CREATE TABLE "Chapters" (
 *  
 * --- Schema for "ClientIds", hash: 2296197975d2a0425dfabf7632f5bd53
 * +-- Schema for "ClientIds", hash: aae19b103f48347cbd022e63e26ced3b
 *  CREATE TABLE "ClientIds" (
 * @@ -75,3 +73,3 @@ CREATE TABLE "ClientIds" (
 *      "firstSeenLandingPage" text,
 * -    "userIds" text[],
 * +    "userIds" text[] DEFAULT '{}' ::text[],
 *      "schemaVersion" double precision DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "dc774f8734d7cc069d913d351d4225b8";

import { updateDefaultValue } from './meta/utils';
import { ClientIds } from '../../server/collections/clientIds/collection';

export const up = async ({db}: MigrationContext) => {
  await updateDefaultValue(db, ClientIds, "userIds");
}

export const down = async ({db}: MigrationContext) => {
  await updateDefaultValue(db, ClientIds, "userIds");
}
