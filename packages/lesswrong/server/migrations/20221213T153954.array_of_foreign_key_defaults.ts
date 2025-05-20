/**
 * Generated on 2022-12-13T15:39:54.751Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * ***Diff too large to display***
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "9e733b575316b2cdd41d3a1d9032131a";

import { updateDefaultValue } from "./meta/utils";
import Books from "../../server/collections/books/collection";
import Chapters from "../../server/collections/chapters/collection";
import Comments from "../../server/collections/comments/collection";
import Conversations from "../../server/collections/conversations/collection";
import Localgroups from "../../server/collections/localgroups/collection";
import Posts from "../../server/collections/posts/collection";
import Tags from "../../server/collections/tags/collection";
import Users from "../../server/collections/users/collection";

export const up = async ({db}: MigrationContext) => {
  await updateDefaultValue(db, Books, "postIds");
  await updateDefaultValue(db, Books, "sequenceIds");
  await updateDefaultValue(db, Chapters, "postIds");
  await updateDefaultValue(db, Comments, "suggestForAlignmentUserIds");
  await updateDefaultValue(db, Conversations, "participantIds");
  await updateDefaultValue(db, Conversations, "archivedByIds");
  await updateDefaultValue(db, Localgroups, "organizerIds");
  await updateDefaultValue(db, Posts, "organizerIds");
  await updateDefaultValue(db, Posts, "suggestForAlignmentUserIds");
  await updateDefaultValue(db, Tags, "tagFlagsIds");
  await updateDefaultValue(db, Tags, "subforumModeratorIds");
  // await updateDefaultValue(db, Users, "bookmarkedPostsMetadata");
  await updateDefaultValue(db, Users, "hiddenPostsMetadata");
  await updateDefaultValue(db, Users, "profileTagIds");
  await updateDefaultValue(db, Users, "organizerOfGroupIds");
}
