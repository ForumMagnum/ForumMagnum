import { registerMigration } from './migrationUtils';
import { recomputeDenormalizedValues } from '../scripts/recomputeDenormalized';

registerMigration({
  name: "fillWikiEditCount",
  dateWritten: "2021-06-05",
  idempotent: true,
  action: async () => {
    await recomputeDenormalizedValues({collectionName: "Users", fieldName: "tagRevisionCount"});
  }
})
