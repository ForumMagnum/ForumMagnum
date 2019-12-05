import { registerMigration } from './migrationUtils';
import { recomputeDenormalizedValues } from '../scripts/recomputeDenormalized';

registerMigration({
  name: "postsModifiedAtField",
  idempotent: true,
  action: async () => {
    await recomputeDenormalizedValues({collectionName: "Posts", fieldName: "modifiedAt"});
  }
});
