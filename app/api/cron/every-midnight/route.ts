import type { NextRequest } from 'next/server';
import { maintainAnalyticsViews } from '@/server/analytics/analyticsViews';
import { refreshKarmaInflation } from '@/server/karmaInflation/cron';
import PostRecommendationsRepo from '@/server/repos/PostRecommendationsRepo';
import { expiredRateLimitsReturnToReviewQueue } from '@/server/users/cron';
import { isEAForum } from '@/lib/instanceSettings';
import { maybeCreateSeasonalOpenThread } from '@/server/posts/seasonalOpenThreadCron';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await refreshKarmaInflation();

  const postRecommendationsRepo = new PostRecommendationsRepo();
  await postRecommendationsRepo.clearStaleRecommendations();

  await expiredRateLimitsReturnToReviewQueue();

  const openThreadResult = await maybeCreateSeasonalOpenThread();
  if (openThreadResult.status !== "not_due" && openThreadResult.status !== "not_lesswrong") {
    // eslint-disable-next-line no-console
    console.log("// Seasonal open thread:", openThreadResult);
  }

  // Maintain analytics views (EA Forum only)
  if (isEAForum()) {
    // This is a fire-and-forget since the db queries take forever
    maintainAnalyticsViews();
  }
  
  return new Response('OK', { status: 200 });
}
