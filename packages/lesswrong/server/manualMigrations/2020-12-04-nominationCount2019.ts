import { registerMigration } from './migrationUtils';
import { recomputeDenormalizedValues } from '../scripts/recomputeDenormalized';

export default registerMigration({
  name: "nominationCount2019",
  dateWritten: "2020-12-04",
  idempotent: true,
  action: async () => {
    await recomputeDenormalizedValues({collectionName: "Posts", fieldName: "nominationCount2019"});
  }
})
