import { registerMigration } from './migrationUtils';
import { recomputeDenormalizedValues } from '../scripts/recomputeDenormalized';

export default registerMigration({
  name: "fillReviewCountField",
  dateWritten: "2021-12-02",
  idempotent: true,
  action: async () => {
    await recomputeDenormalizedValues({collectionName: "Posts", fieldName: "reviewCount"});
  },
});
