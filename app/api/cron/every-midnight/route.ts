import type { NextRequest } from 'next/server';
import { clearOldCronHistories } from '@/server/cron/cronUtil';
import { maintainAnalyticsViews } from '@/server/analytics/analyticsViews';
import { sendInactiveUserSurveyEmails } from '@/server/inactiveUserSurveyCron';
import { refreshKarmaInflation } from '@/server/karmaInflation/cron';
import { pruneOldPerfMetrics } from '@/server/analytics/serverAnalyticsWriter';
import PostRecommendationsRepo from '@/server/repos/PostRecommendationsRepo';
import { sendJobAdReminderEmails } from '@/server/userJobAdCron';
import { expiredRateLimitsReturnToReviewQueue } from '@/server/users/cron';
import { updateScoreInactiveDocuments } from '@/server/votingCron';
import { isEAForum, performanceMetricLoggingEnabled } from '@/lib/instanceSettings';
import { suggestedTimeouts } from "@/server/pageTimeouts";

export const maxDuration = suggestedTimeouts.cronjob;

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

  // Send some emails and maintain analytics views (EA Forum only)
  if (isEAForum()) {
    // Run all daily midnight tasks in parallel
    const tasks: Promise<void>[] = [];
    tasks.push(sendInactiveUserSurveyEmails());
    tasks.push(sendJobAdReminderEmails());
    await Promise.all(tasks);

    // This is a fire-and-forget since the db queries take forever
    maintainAnalyticsViews();
  }
  
  return new Response('OK', { status: 200 });
}
