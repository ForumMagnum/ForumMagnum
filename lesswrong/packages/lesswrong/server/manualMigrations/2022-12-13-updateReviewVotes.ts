import { updateReviewVoteTotals } from '../reviewVoteUpdate';
import { registerMigration } from './migrationUtils';


registerMigration({
  name: "updateReviewVotes",
  dateWritten: "2022-12-15",
  idempotent: true,
  action: async () => {
    await updateReviewVoteTotals("nominationVote") 
    // await updateReviewVoteTotals("finalVote") 
  }
})
