import { registerMigration } from './migrationUtils';
import { recomputeDenormalizedValues } from '../scripts/recomputeDenormalized';

export default registerMigration({
  name: "filterDebateResponses",
  dateWritten: "2023-09-08",
  idempotent: true,
  action: async () => {
    await recomputeDenormalizedValues({collectionName: "Posts", fieldName: "commentCount"});
    await recomputeDenormalizedValues({collectionName: "Posts", fieldName: "afCommentCount"});
  },
});
