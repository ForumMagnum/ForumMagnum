export const up = async ({db}: MigrationContext) => {
  await db.none(`UPDATE "RejectionAppeals" SET "status" = 'dismissed' WHERE "status" = 'denied'`);
};

export const down = async ({db}: MigrationContext) => {
  await db.none(`UPDATE "RejectionAppeals" SET "status" = 'denied' WHERE "status" = 'dismissed'`);
};
