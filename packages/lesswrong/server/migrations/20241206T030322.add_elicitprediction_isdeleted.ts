import ElicitQuestionPredictions from "@/server/collections/elicitQuestionPredictions/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, ElicitQuestionPredictions, "isDeleted");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ElicitQuestionPredictions, "isDeleted");
}
