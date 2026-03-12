import LoginTokens from "../collections/loginTokens/collection"
import { createTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, LoginTokens);
}

export const down = async ({db}: MigrationContext) => {
}
