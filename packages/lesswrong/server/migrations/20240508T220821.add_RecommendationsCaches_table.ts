/**
 * Generated on 2024-05-08T22:08:21.012Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index 6995c1fa16..e0f1050a91 100644
 * 
 * Large diff deleted; mostly irrelevant due to switching the order of functions and custom indexes
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "224c974d441de3727845f2dec5ba8aac";

import RecommendationsCaches from "../../lib/collections/recommendationsCaches/collection"
import { createTable, dropTable, updateIndexes } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, RecommendationsCaches);
  await updateIndexes(RecommendationsCaches);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, RecommendationsCaches);
}
