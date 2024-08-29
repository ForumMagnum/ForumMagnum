/**
 * Generated on 2024-08-29T00:27:52.639Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * index 86e0696033..ab0a21bfef 100644
 * --- a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 3da0f2961c017b248168aeaa90955305
 * -
 * --- Accepted on 2024-08-28T23:08:39.000Z by 20240828T230839.update_userId_type_on_LlmConversations.ts
 * +-- Overall schema hash: fbfbc086986d64913d7474fde81eaea8
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
export const acceptsSchemaHash = "fbfbc086986d64913d7474fde81eaea8";

import Spotlights from "../../lib/collections/spotlights/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Spotlights, "deletedDraft")
  await addField(db, Spotlights, "spotlightSplashImageUrl")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Spotlights, "deletedDraft");
  await dropField(db, Spotlights, "spotlightSplashImageUrl");
}