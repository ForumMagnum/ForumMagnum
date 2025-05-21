import Revisions from "@/server/collections/revisions/collection"
import { addField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Revisions, "skipAttributions");
}

export const down = async ({db}: MigrationContext) => {
}
