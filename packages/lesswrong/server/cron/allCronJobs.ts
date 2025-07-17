import { cronUpdateAnalyticsCollections } from "@/server/analytics/analyticsCron";
import { cronMaintainAnalyticsViews } from "@/server/analytics/analyticsViews";
import { cronClearExpiredPageCacheEntries } from "@/server/cache/cron";
import { cronClearOldCronHistories, type CronJobSpec } from "@/server/cron/cronUtil";
import { sendCurationEmailsCron } from "@/server/curationEmails/cron";
import { cronDebouncedEventHandler } from "@/server/debouncer";
import { cronUpdateMissingEmbeddings } from "@/server/embeddings";
import { cronCheckAndSendUpcomingEventEmails } from "@/server/eventReminders";
import { sendInactiveUserSurveyEmailsCron } from "@/server/inactiveUserSurveyCron";
import { sendInactiveUserSummaryEmailsCron } from "@/server/emails/inactiveUserSummaryCron";
import { refreshKarmaInflationCron } from "@/server/karmaInflation/cron";
import { checkScheduledPostsCron } from "@/server/posts/cron";
import { prunePerfMetricsCron } from "@/server/prunePerfMetricsCron";
import { clearStaleRecommendationsCron } from "@/server/recommendations/recommedationsCron";
import { clearArbitalCacheCron } from "@/server/resolvers/arbitalPageData";
import { addNewRSSPostsCron } from "@/server/rss-integration/cron";
import { updatePromotedSpotlightItemCron } from "@/server/spotlightCron";
import { runTwitterBotCron } from "@/server/twitterBot";
import { sendJobAdReminderEmailsCron } from "@/server/userJobAdCron";
import { updateUserActivitiesCron } from "@/server/useractivities/cron";
import { expiredRateLimitsReturnToReviewQueueCron } from "@/server/users/cron";
import { permanentlyDeleteUsersCron } from "@/server/users/permanentDeletion";
import { updateScoreActiveDocumentsCron, updateScoreInactiveDocumentsCron } from "@/server/votingCron";
import { getAllPostgresViews } from "../postgresView";
import { keywordAlertsCron } from "../keywordAlerts/keywordAlertsCron";

export const allCronJobs: (CronJobSpec|null)[] = [
  cronClearOldCronHistories,
  cronUpdateAnalyticsCollections,
  cronMaintainAnalyticsViews,
  cronClearExpiredPageCacheEntries,
  sendCurationEmailsCron,
  cronDebouncedEventHandler,
  cronUpdateMissingEmbeddings,
  cronCheckAndSendUpcomingEventEmails,
  sendInactiveUserSurveyEmailsCron,
  sendInactiveUserSummaryEmailsCron,
  refreshKarmaInflationCron,
  checkScheduledPostsCron,
  prunePerfMetricsCron,
  clearStaleRecommendationsCron,
  clearArbitalCacheCron,
  addNewRSSPostsCron,
  updatePromotedSpotlightItemCron,
  runTwitterBotCron,
  updateUserActivitiesCron,
  sendJobAdReminderEmailsCron,
  expiredRateLimitsReturnToReviewQueueCron,
  permanentlyDeleteUsersCron,
  updateScoreActiveDocumentsCron,
  updateScoreInactiveDocumentsCron,
  keywordAlertsCron,
  ...getAllPostgresViews().map((view) => view.getCronJob()),
];
