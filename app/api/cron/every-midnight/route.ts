import type { NextRequest } from 'next/server';
import { clearOldCronHistories } from '@/server/cron/cronUtil';
import { refreshKarmaInflation } from '@/server/karmaInflation/cron';
import { pruneOldPerfMetrics } from '@/server/analytics/serverAnalyticsWriter';
import PostRecommendationsRepo from '@/server/repos/PostRecommendationsRepo';
import { expiredRateLimitsReturnToReviewQueue } from '@/server/users/cron';
import { updateScoreInactiveDocuments } from '@/server/votingCron';
import { performanceMetricLoggingEnabled } from '@/lib/instanceSettings';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await clearOldCronHistories();

  await refreshKarmaInflation();

  const postRecommendationsRepo = new PostRecommendationsRepo();
  await postRecommendationsRepo.clearStaleRecommendations();

  await expiredRateLimitsReturnToReviewQueue();

  await updateScoreInactiveDocuments();

  // This one's probably the longest-running, so do it last
  if (performanceMetricLoggingEnabled.get()) {
    await pruneOldPerfMetrics();
  }

  return new Response('OK', { status: 200 });
}
