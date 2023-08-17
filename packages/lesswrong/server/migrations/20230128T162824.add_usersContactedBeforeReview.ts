export const acceptsSchemaHash = "d50f15282182788bd0774a231773097a";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (!Users.isPostgres()) {
    return
  }
  
  await addField(db, Users, "usersContactedBeforeReview")
}

export const down = async ({db}: MigrationContext) => {
  if (!Users.isPostgres()) {
    return
  }
  
  await dropField(db, Users, "usersContactedBeforeReview")
}
