export const up = async ({db}: MigrationContext) => {
  await db.none(`
    ALTER TABLE "ReviewWinners"
      ALTER COLUMN "curatedOrder" DROP NOT NULL,
      ALTER COLUMN "isAI" DROP NOT NULL
  `);
}

export const down = async ({db}: MigrationContext) => {
  
}
