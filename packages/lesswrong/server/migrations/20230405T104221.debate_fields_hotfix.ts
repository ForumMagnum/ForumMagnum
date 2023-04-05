import Users from "../../lib/vulcan-users"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, "notificationDebateCommentsOnSubscribedPost");
    await addField(db, Users, "notificationDebateReplies");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "notificationDebateCommentsOnSubscribedPost");
    await dropField(db, Users, "notificationDebateReplies");
  }
}
