import { registerMigration } from './migrationUtils';
import { updateReviewVoteTotals } from '../../lib/reviewUtils';


registerMigration({
  name: "updateReviewVotes",
  dateWritten: "2022-12-15",
  idempotent: true,
  action: async () => {
    updateReviewVoteTotals("nominationVote") 
  }
})