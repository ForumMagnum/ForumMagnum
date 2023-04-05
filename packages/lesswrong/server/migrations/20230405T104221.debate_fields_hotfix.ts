import Users from "../../lib/vulcan-users"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    addField(db, Users, "notificationDebateCommentsOnSubscribedPost");
    addField(db, Users, "notificationDebateReplies");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    dropField(db, Users, "notificationDebateCommentsOnSubscribedPost");
    dropField(db, Users, "notificationDebateReplies");
  }
}
