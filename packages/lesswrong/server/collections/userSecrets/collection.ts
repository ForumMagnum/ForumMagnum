import schema from '@/lib/collections/userSecrets/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const UserSecrets: UserSecretsCollection = createCollection({
  collectionName: 'UserSecrets',
  typeName: 'UserSecret',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    // "A secret name is unique within its scope" — two partial unique indexes,
    // one for user-global secrets and one for repo-scoped ones, so a global and
    // a repo-scoped secret can share a name and two repos can each hold their
    // own. Partial indexes have to be custom Postgres indexes.
    indexSet.addCustomPgIndex(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_UserSecrets_global"
      ON "UserSecrets" ("userId", "name")
      WHERE "repoScope" IS NULL;
    `);
    indexSet.addCustomPgIndex(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_UserSecrets_repoScoped"
      ON "UserSecrets" ("userId", "repoScope", "name")
      WHERE "repoScope" IS NOT NULL;
    `);
    return indexSet;
  },
});


export default UserSecrets;
