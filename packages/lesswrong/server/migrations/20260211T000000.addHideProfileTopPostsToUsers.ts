import Users from "../collections/users/collection";
import { addField, dropField } from "./meta/utils";

/**
 * Migration to add hideProfileTopPosts to Users.
 * This field allows users to hide the featured top-posts section on profile pages.
 */
export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "hideProfileTopPosts");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "hideProfileTopPosts");
}
