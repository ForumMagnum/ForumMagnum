import Users from "../../lib/vulcan-users"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, "notificationDebateCommentsOnSubscribedPost" as any);
    await addField(db, Users, "notificationDebateReplies" as any);
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "notificationDebateCommentsOnSubscribedPost" as any);
    await dropField(db, Users, "notificationDebateReplies" as any);
  }
}
