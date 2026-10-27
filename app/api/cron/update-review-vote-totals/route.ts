import type { NextRequest } from 'next/server';
import { checkCronRequestAuthorization } from '@/server/utils/cronAuth';
import { updateReviewVoteTotals } from '@/server/reviewVoteUpdate';
import { 
  REVIEW_YEAR, 
  getNominationPhaseEnd, 
  getReviewPhaseEnd
} from '@/lib/reviewUtils';
import moment from 'moment';

/**
 * Checks if today is one of the target dates for updating review vote totals:
 * - 24 hours before the review phase starts (end of nominations)
 * - 24 hours before the voting phase starts (end of reviews)
 * - Halfway between those two dates
 * 
 * Returns the vote phase to update, or null if today is not a target date.
 */
function getVotePhaseToUpdate(): 'nominationVote' | 'finalVote' | null {
  const now = moment.utc();
  const today = now.startOf('day');
  
  const nominationsEnd = getNominationPhaseEnd(REVIEW_YEAR);
  const reviewsEnd = getReviewPhaseEnd(REVIEW_YEAR);
  
  const beforeReviewPhase = nominationsEnd.clone().subtract(24, 'hours').startOf('day');
  const beforeVotingPhase = reviewsEnd.clone().subtract(24, 'hours').startOf('day');
  const midpoint = moment.utc(
    nominationsEnd.valueOf() + ((reviewsEnd.valueOf() - nominationsEnd.valueOf()) / 2)
  ).startOf('day');
  
  if (today.isSame(beforeReviewPhase, 'day') || today.isSame(midpoint, 'day')) {
    return 'nominationVote';
  }
  
  if (today.isSame(beforeVotingPhase, 'day')) {
    return 'finalVote';
  }
  
  return null;
}

export async function GET(request: NextRequest) {
  const authError = checkCronRequestAuthorization(request);
  if (authError) {
    return authError;
  }

  const votePhase = getVotePhaseToUpdate();
  
  if (votePhase) {
    // eslint-disable-next-line no-console
    console.log(`Running updateReviewVoteTotals for ${votePhase}`);
    await updateReviewVoteTotals(votePhase);
    // eslint-disable-next-line no-console
    console.log(`Completed updateReviewVoteTotals for ${votePhase}`);
    return new Response(`Updated ${votePhase}`, { status: 200 });
  }

  // eslint-disable-next-line no-console
  console.log('updateReviewVoteTotals cron: not a target date, skipping');
  return new Response('Not a target date, skipping', { status: 200 });
}

