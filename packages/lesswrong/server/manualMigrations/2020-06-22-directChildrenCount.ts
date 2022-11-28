import { registerMigration } from './migrationUtils';
import { recomputeDenormalizedValues } from '../scripts/recomputeDenormalized';


registerMigration({
  name: "setDirectChildrenCount",
  dateWritten: "2020-06-22",
  idempotent: true,
  action: async () => {
    await recomputeDenormalizedValues({collectionName: "Comments", fieldName: "directChildrenCount"})
  },
});
