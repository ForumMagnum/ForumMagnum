import { DAY_MS } from "@/lib/aiDigest/constants";
import { captureException } from "@/lib/sentryWrapper";
import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";
import AiDigestSchedules from "@/server/collections/aiDigestSchedules/collection";
import Users from "@/server/collections/users/collection";
import {
  aiDigestEmailCadenceDaysSetting,
  aiDigestScheduledEmailsEnabledSetting,
} from "@/server/databaseSettings";
import { aiDigestEmailBody } from "@/server/emailComponents/AiDigestEmail";
import { AI_DIGEST_UTM_PARAMS } from "@/server/emailComponents/aiDigestEmailLinks";
import { wrapAndSendEmail } from "@/server/emails/renderEmail";
import { createNotification } from "@/server/notificationCallbacksHelpers";
import AiDigestSchedulesRepo from "@/server/repos/AiDigestSchedulesRepo";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { generateAiDigestIssue } from "./aiDigestGenerateIssue";

/**
 * Generation is a multi-minute LLM call and cron invocations are time-bounded,
 * so each run handles only a couple of readers and the next hourly run picks up
 * the rest. Comfortable for an admin-sized cohort.
 */
const SENDS_PER_RUN = 2;
/** Longer than any run can last, so a claim only lapses if its run died. */
const CLAIM_DURATION_MS = 30 * 60 * 1_000;
/**
 * The next issue is due this much before a full cadence has passed: the job
 * runs hourly, so without it each send would drift a little later than the last.
 */
const DUE_SLACK_MS = 2 * 60 * 60 * 1_000;

async function loadOrGenerateIssue(
  schedule: DbAiDigestSchedule,
  user: DbUser,
  context: ResolverContext,
): Promise<{ issueId: string; spec: AiDigestSpec }> {
  // An issue that was generated but failed to send is sent rather than regenerated.
  const unsentIssue = schedule.issueId ? await AiDigestIssues.findOne(schedule.issueId) : null;
  if (unsentIssue) {
    return { issueId: unsentIssue._id, spec: unsentIssue.spec };
  }
  const issue = await generateAiDigestIssue({ user, context, trigger: "scheduled", countsTowardHistory: true });
  await AiDigestSchedules.rawUpdateOne({ _id: schedule._id }, { $set: { issueId: issue.issueId } });
  return issue;
}

async function sendAiDigestToReader(schedule: DbAiDigestSchedule): Promise<void> {
  const user = await Users.findOne(schedule.userId);
  if (!user) {
    throw new Error(`No user ${schedule.userId} for AI digest schedule ${schedule._id}`);
  }
  const context = computeContextFromUser({ user, isSSR: false });
  const { issueId, spec } = await loadOrGenerateIssue(schedule, user, context);
  const sent = await wrapAndSendEmail({
    forumType: "LessWrong",
    user,
    subject: spec.subject,
    body: aiDigestEmailBody(spec, issueId),
    utmParams: AI_DIGEST_UTM_PARAMS,
  });
  if (!sent) {
    throw new Error(`Failed to send scheduled AI digest issue ${issueId} to ${user._id}`);
  }
  const sentAt = new Date();
  const cadenceDays = Math.max(1, aiDigestEmailCadenceDaysSetting.get("LessWrong"));
  await AiDigestIssues.rawUpdateOne({ _id: issueId }, { $set: { emailedAt: sentAt } });
  await AiDigestSchedules.rawUpdateOne({ _id: schedule._id }, {
    $set: {
      nextDueAt: new Date(sentAt.getTime() + (cadenceDays * DAY_MS) - DUE_SLACK_MS),
      claimedUntil: null,
      issueId: null,
    },
  });
  await createNotification({
    userId: user._id,
    notificationType: "aiDigestReady",
    documentType: null,
    documentId: null,
    extraData: { issueId, subject: spec.subject, aiNote: spec.aiNote.paragraphs },
    context,
  });
}

export async function sendScheduledAiDigestEmails(): Promise<void> {
  if (!aiDigestScheduledEmailsEnabledSetting.get("LessWrong")) {
    return;
  }
  const schedulesRepo = new AiDigestSchedulesRepo();
  await schedulesRepo.addMissingSchedules();
  const schedules = await schedulesRepo.claimDueSchedules({
    limit: SENDS_PER_RUN,
    claimDurationMs: CLAIM_DURATION_MS,
  });
  for (const schedule of schedules) {
    // One reader's failed generation or send must not block the others; it is
    // retried on the next run.
    try {
      await sendAiDigestToReader(schedule);
    } catch (error) {
      captureException(error);
      // eslint-disable-next-line no-console
      console.error(`Scheduled AI digest failed for user ${schedule.userId}`, error);
      await AiDigestSchedules.rawUpdateOne({ _id: schedule._id }, { $set: { claimedUntil: null } });
    }
  }
}
