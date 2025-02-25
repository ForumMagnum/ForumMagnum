
export const up = async ({db}: MigrationContext) => {
  await db.none(`ALTER TABLE "ElicitQuestionPredictions" ALTER COLUMN "prediction" DROP NOT NULL`);
}

export const down = async ({db}: MigrationContext) => {
}
