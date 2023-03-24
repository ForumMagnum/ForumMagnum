/**
 * Generated on 2023-03-24T20:55:37.514Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * ***Diff too large to display***
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "9f5bfc2c660a51d8fa28ef4f7cf66955";

import { Comments } from "../../lib/collections/comments";
import { Posts } from "../../lib/collections/posts"
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (Posts.isPostgres()) {
    await addField(db, Posts, 'debate');
  }

  if (Comments.isPostgres()) {
    await addField(db, Comments, 'debateComment');
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Posts.isPostgres()) {
    await dropField(db, Posts, 'debate');
  }

  if (Comments.isPostgres()) {
    await dropField(db, Comments, 'debateComment');
  }
}
