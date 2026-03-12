import { randomId } from '@/lib/random';
import Users from '../collections/users/collection';
import { runSqlQuery } from '../sql/sqlClient';
import { forEachDocumentBatchInCollection, registerMigration } from './migrationUtils';

export default registerMigration({
  name: "migrateLoginTokens",
  dateWritten: "2025-11-17",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Users,
      callback: async (users) => {
        await migrateLoginTokensForUserBatch(users);
      }
    });
  }
});

async function migrateLoginTokensForUserBatch(users: DbUser[]) {
  const tokensToInsert: Array<Omit<DbInsertion<DbLoginToken>, "schemaVersion">> = [];
  for (const user of users) {
    if (!user.services?.resume?.loginTokens) {
      continue;
    }
    const tokensOnUserObject: Array<{when: string, hashedToken: string}> = user.services.resume.loginTokens;
    if (Array.isArray(tokensOnUserObject)) {
      for (const token of tokensOnUserObject) {
        tokensToInsert.push({
          _id: randomId(),
          hashedToken: token.hashedToken,
          createdAt: new Date(token.when),
          userId: user._id,
          loggedOutAt: null,
        });
      }
    }
  }

  await runSqlQuery(`
    INSERT INTO "LoginTokens" (_id, "hashedToken", "userId", "createdAt")
    SELECT t."_id", t."hashedToken", t."userId", t."createdAt"
    FROM jsonb_to_recordset($1::jsonb) AS t(
      "_id" text, "hashedToken" text, "userId" text, "createdAt" timestamptz
    )
  `, [JSON.stringify(tokensToInsert)]);

  const userIds = users.map(u => u._id);
  await runSqlQuery(`
    UPDATE "Users"
    SET services = services #- '{resume,loginTokens}'
    WHERE _id = ANY($1)
      AND jsonb_typeof(services->'resume') = 'object'
      AND jsonb_typeof(services->'resume'->'loginTokens') = 'array';
  `, [userIds]);
}
