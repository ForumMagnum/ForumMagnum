import { updateReviewVoteTotals } from '../reviewVoteUpdate';
import { registerMigration } from './migrationUtils';

export default registerMigration({
  name: "updateReviewVotesFinal",
  dateWritten: "2023-01-7",
  idempotent: true,
  action: async () => {
    await updateReviewVoteTotals("finalVote") 
  }
})
