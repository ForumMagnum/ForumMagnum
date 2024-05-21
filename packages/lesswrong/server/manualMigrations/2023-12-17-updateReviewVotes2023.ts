import { updateReviewVoteTotals } from '../reviewVoteUpdate';
import { registerMigration } from './migrationUtils';


registerMigration({
  name: "updateReviewVotes2023",
  dateWritten: "2023-12-23",
  idempotent: true,
  action: async () => {
    await updateReviewVoteTotals("nominationVote") 
    // await updateReviewVoteTotals("finalVote") 
  }
})
