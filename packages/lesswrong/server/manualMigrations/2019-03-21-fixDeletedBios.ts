import { registerMigration } from './migrationUtils';
import { recomputeDenormalizedValues } from '../scripts/recomputeDenormalized';

registerMigration({
  name: "fixDeletedBios",
  dateWritten: "2019-03-21",
  idempotent: true,
  action: async () => {
    await recomputeDenormalizedValues({collectionName: "Users", fieldName: "htmlBio" as keyof ObjectsByCollectionName['Users']});
  }
});
