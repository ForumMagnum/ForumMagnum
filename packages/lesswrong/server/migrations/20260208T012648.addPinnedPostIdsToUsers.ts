import Users from "../collections/users/collection";
import { addField, dropField } from "./meta/utils";

/**
 * Migration to add pinnedPostIds field to Users.
 * This field allows users to customize which posts appear as featured posts on their profile.
 */
export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "pinnedPostIds");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "pinnedPostIds");
}
