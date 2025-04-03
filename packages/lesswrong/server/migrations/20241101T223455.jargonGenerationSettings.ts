import { addField, dropField } from "./meta/utils";
import Users from "@/server/collections/users/collection";
import Posts from "@/server/collections/posts/collection";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, 'generateJargonForDrafts');
  await addField(db, Users, 'generateJargonForPublishedPosts');
  await addField(db, Posts, 'generateDraftJargon');
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, 'generateJargonForDrafts');
  await dropField(db, Users, 'generateJargonForPublishedPosts');
  await dropField(db, Posts, 'generateDraftJargon');
}
