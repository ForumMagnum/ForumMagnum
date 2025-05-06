import AutomatedContentEvaluations from "../collections/automatedContentEvaluations/collection"
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
    await createTable(db, AutomatedContentEvaluations)
}

export const down = async ({db}: MigrationContext) => {
    await dropTable(db, AutomatedContentEvaluations)
}
