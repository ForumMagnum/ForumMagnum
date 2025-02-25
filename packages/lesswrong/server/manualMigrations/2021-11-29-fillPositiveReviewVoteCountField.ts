import { registerMigration } from './migrationUtils';
import { recomputeDenormalizedValues } from '../scripts/recomputeDenormalized';


export default registerMigration({
  name: "fillPositiveReviewVoteCountField",
  dateWritten: "2021-11-27",
  idempotent: true,
  action: async () => {
    await recomputeDenormalizedValues({collectionName: "Posts", fieldName: "positiveReviewVoteCount"});
  },
});

