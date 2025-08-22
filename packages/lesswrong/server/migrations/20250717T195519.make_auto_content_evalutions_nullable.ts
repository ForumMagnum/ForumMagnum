export const up = async ({db}: MigrationContext) => {
  await db.none(`ALTER TABLE "AutomatedContentEvaluations"
    ALTER COLUMN "score" DROP NOT NULL,
    ALTER COLUMN "sentenceScores" DROP NOT NULL,
    ALTER COLUMN "aiChoice" DROP NOT NULL,
    ALTER COLUMN "aiReasoning" DROP NOT NULL,
    ALTER COLUMN "aiCoT" DROP NOT NULL
  `);
}

export const down = async ({db}: MigrationContext) => {  
}
