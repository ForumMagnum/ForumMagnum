import { addField, dropField } from "./meta/utils"
import Users from "../collections/users/collection"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "blockedUserIds")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "blockedUserIds")
}
