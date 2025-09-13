/**
 * Generated on 2024-09-06T19:20:38.090Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jbabcock/repositories/Lesserwrong/alt-LessWrong2/schema/accepted_schema.sql b/Users/jbabcock/repositories/Lesserwrong/alt-LessWrong2/schema/schema_to_accept.sql
 * index 7c3f6ad7f6..672f81162c 100644
 * --- a/Users/jbabcock/repositories/Lesserwrong/alt-LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/jbabcock/repositories/Lesserwrong/alt-LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: f857f474b5a374350cc1797a5d9240fa
 * -
 * --- Accepted on 2024-09-04T20:55:02.000Z by 20240904T205502.create_curation_notices_table.ts
 * +-- Overall schema hash: 4478fe67319e5ebbe8327768fc26f5f4
 *  
 * @@ -1004,10 +1002,2 @@ CREATE INDEX IF NOT EXISTS "idx_LWEvents_name_userId_createdAt" ON "LWEvents" US
 *  
 * --- Index "idx_LWEvents_name_properties__ip_createdAt_userId", hash 8877c44ed56ea7fb0c8b43ab33b46c79
 * -CREATE INDEX IF NOT EXISTS "idx_LWEvents_name_properties__ip_createdAt_userId" ON "LWEvents" USING gin (
 * -  "name",
 * -  ("properties" -> 'ip'),
 * -  "createdAt",
 * -  "userId"
 * -);
 * -
 *  -- Table "LegacyData", hash d45debc4c574f940da4c065f7f259ff2
 * @@ -3592,2 +3582,9 @@ WHERE
 *  
 * +-- CustomIndex "manual_idx__LWEvents_properties_ip", hash e98657caca327bb52d72d4d127b1a9cb
 * +CREATE INDEX IF NOT EXISTS "manual_idx__LWEvents_properties_ip" ON public."LWEvents" USING gin ((("properties" ->> 'ip')::TEXT))
 * +WITH
 * +  (fastupdate = TRUE)
 * +WHERE
 * +  name = 'login';
 * +
 *  -- Function "fm_has_verified_email", hash 6d997db78a8f710d18396d7255a82bb5
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "4478fe67319e5ebbe8327768fc26f5f4";

import { backgroundTask } from "../utils/backgroundTask";
import { updateCustomIndexes } from "./meta/utils"

export const up = async ({dbOutsideTransaction}: MigrationContext) => {
  // `void` instead of `await` when using `dbOutsideTransaction` to avoid a
  // nasty deadlock
  backgroundTask(updateCustomIndexes(dbOutsideTransaction));
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
