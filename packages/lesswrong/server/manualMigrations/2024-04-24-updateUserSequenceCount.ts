import { registerMigration } from './migrationUtils';
import { recomputeDenormalizedValues } from '../scripts/recomputeDenormalized';

registerMigration({
  name: "updateUserSequenceCount",
  dateWritten: "2024-04-24",
  idempotent: true,
  action: async () => {
    await recomputeDenormalizedValues({collectionName: "Users", fieldName: "sequenceCount"});
  }
})

