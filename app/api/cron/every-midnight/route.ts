import type { NextRequest } from 'next/server';
import { clearOldCronHistories } from '@/server/cron/cronUtil';
import { maintainAnalyticsViews } from '@/server/analytics/analyticsViews';
import { updateMissingPostEmbeddings, HAS_EMBEDDINGS_FOR_RECOMMENDATIONS } from '@/server/embeddings';
import { sendInactiveUserSurveyEmails } from '@/server/inactiveUserSurveyCron';
import { refreshKarmaInflation } from '@/server/karmaInflation/cron';
import { pruneOldPerfMetrics } from '@/server/analytics/serverAnalyticsWriter';
import PostRecommendationsRepo from '@/server/repos/PostRecommendationsRepo';
import { clearOldUltraFeedServedEvents } from '@/server/ultraFeed/cron';
import { sendJobAdReminderEmails } from '@/server/userJobAdCron';
import { expiredRateLimitsReturnToReviewQueue } from '@/server/users/cron';
import { updateScoreInactiveDocuments } from '@/server/votingCron';
import { isEAForum, performanceMetricLoggingEnabled } from '@/lib/instanceSettings';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Run all daily midnight tasks in parallel
  const tasks: Promise<void>[] = [];

  // Clear old cron histories
  tasks.push(clearOldCronHistories());

  // Maintain analytics views (EA Forum only)
  if (isEAForum) {
    tasks.push(maintainAnalyticsViews());
  }

  // Update missing embeddings
  if (HAS_EMBEDDINGS_FOR_RECOMMENDATIONS) {
    tasks.push(updateMissingPostEmbeddings());
  }

  // Send inactive user survey emails (EA Forum only)
  if (isEAForum) {
    tasks.push(sendInactiveUserSurveyEmails());
  }

  // Refresh karma inflation
  tasks.push(refreshKarmaInflation());

  // Prune old performance metrics
  if (performanceMetricLoggingEnabled.get()) {
    tasks.push(pruneOldPerfMetrics());
  }

  // Clear stale recommendations
  const postRecommendationsRepo = new PostRecommendationsRepo();
  tasks.push(postRecommendationsRepo.clearStaleRecommendations());

  // Clear old ultrafeed served events
  tasks.push(clearOldUltraFeedServedEvents());

  // Send job ad reminder emails (EA Forum only)
  if (isEAForum) {
    tasks.push(sendJobAdReminderEmails());
  }

  // Handle expired rate limits
  tasks.push(expiredRateLimitsReturnToReviewQueue());

  // Update score for inactive documents
  tasks.push(updateScoreInactiveDocuments());

  // Execute all tasks in parallel
  await Promise.all(tasks);
  
  return new Response('OK', { status: 200 });
} 