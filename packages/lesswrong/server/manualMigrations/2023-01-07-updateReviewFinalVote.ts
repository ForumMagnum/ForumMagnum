import { updateReviewVoteTotals } from '../../lib/reviewVoteUpdate';
import { registerMigration } from './migrationUtils';

registerMigration({
  name: "updateReviewVotesFinal",
  dateWritten: "2023-01-01",
  idempotent: true,
  action: async () => {
    await updateReviewVoteTotals("finalVote") 
  }
})
