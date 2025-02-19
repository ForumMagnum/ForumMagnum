const dropOldVoteIndex = 'DROP INDEX IF EXISTS "idx_Votes_authorIds_votedAt_userId_afPower";';

export const up = async ({db}: MigrationContext) => {
  await db.none(dropOldVoteIndex);
}

export const down = async ({db}: MigrationContext) => {
}
