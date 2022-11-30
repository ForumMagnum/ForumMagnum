import { registerMigration } from './migrationUtils';
import { recomputeDenormalizedValues } from '../scripts/recomputeDenormalized';

registerMigration({
  name: "updateMessageCounts",
  dateWritten: "2019-06-03",
  idempotent: true,
  action: async () => {
    await recomputeDenormalizedValues({collectionName: "Conversations", fieldName: "messageCount"});
  }
});
