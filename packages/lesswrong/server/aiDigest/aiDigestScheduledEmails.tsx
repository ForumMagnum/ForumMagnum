import React from "react";
import { captureException } from "@/lib/sentryWrapper";
import { AI_DIGEST_EMAIL_TYPE } from "@/lib/emails/emailTracking";
import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";
import {
  aiDigestEmailCadenceDaysSetting,
  aiDigestScheduledEmailsEnabledSetting,
} from "@/server/databaseSettings";
import { AiDigestEmail } from "@/server/emailComponents/AiDigestEmail";
import type { AiDigestSpec } from "@/server/emailComponents/AiDigestSpec";
import type { EmailContextType } from "@/server/emailComponents/emailContext";
import { wrapAndSendEmail } from "@/server/emails/renderEmail";
import { findUsersToEmail } from "@/server/curationEmails/cron";
import { createNotification } from "@/server/notificationCallbacksHelpers";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { generateAiDigestPostSelection } from "./aiDigestPostSelection";

const DAY_MS = 24 * 60 * 60 * 1_000;

/**
 * Slack subtracted from the cadence when deciding whether a reader is due.
 * The job runs hourly, so without it each send would drift a little later than
 * the last one and the cadence would slowly stretch.
 */
export const AI_DIGEST_SEND_DUE_SLACK_MS = 2 * 60 * 60 * 1_000;
export const AI_DIGEST_MIN_CADENCE_DAYS = 1;
/**
 * Generation is a multi-minute LLM call and cron invocations are time-bounded,
 * so each run drains only a couple of readers and the next hourly run picks up
 * the rest. Comfortable for an admin-sized cohort.
 */
export const AI_DIGEST_SCHEDULED_SENDS_PER_RUN = 2;

function boundedCadenceDays(cadenceDays: number): number {
  return Math.max(AI_DIGEST_MIN_CADENCE_DAYS, cadenceDays);
}

/**
 * The newest `generatedAt` that still leaves a reader due for another issue.
 */
export function aiDigestSendDueBefore(now: Date, cadenceDays: number): Date {
  return new Date(
    now.getTime() - (boundedCadenceDays(cadenceDays) * DAY_MS) + AI_DIGEST_SEND_DUE_SLACK_MS,
  );
}

export function isAiDigestSendDue({
  lastScheduledIssueAt,
  cadenceDays,
  now,
}: {
  lastScheduledIssueAt: Date | null;
  cadenceDays: number;
  now: Date;
}): boolean {
  if (!lastScheduledIssueAt) {
    return true;
  }
  return lastScheduledIssueAt <= aiDigestSendDueBefore(now, cadenceDays);
}

function aiDigestEmailBody(spec: AiDigestSpec) {
  return function renderAiDigestEmail(emailContext: EmailContextType) {
    return <AiDigestEmail spec={spec} emailContext={emailContext} />;
  };
}

/**
 * TODO: the beta is admin-only. Widening this to all subscribers should happen
 * alongside the other production changes (notably the 28-day candidate window
 * noted in aiDigestPostCandidates.ts).
 */
async function loadAiDigestSubscribers(): Promise<DbUser[]> {
  return findUsersToEmail({
    isAdmin: true,
    emailSubscribedToAiDigest: true,
    deleted: { $ne: true },
    unsubscribeFromAll: { $ne: true },
  });
}

async function loadLastScheduledIssueAt(
  recipientIds: string[],
  dueBefore: Date,
): Promise<Map<string, Date>> {
  if (recipientIds.length === 0) {
    return new Map();
  }
  // Only issues newer than the cutoff can make a reader not-due, so this stays
  // bounded no matter how much history a reader accumulates.
  const issues = await AiDigestIssues.find(
    {
      recipientId: { $in: recipientIds },
      trigger: "scheduled",
      generatedAt: { $gt: dueBefore },
    },
    { sort: { generatedAt: -1, _id: -1 } },
    { recipientId: 1, generatedAt: 1 },
  ).fetch();
  return issues.reduce((latest, issue) => {
    const previous = latest.get(issue.recipientId);
    if (!previous || previous < issue.generatedAt) {
      latest.set(issue.recipientId, issue.generatedAt);
    }
    return latest;
  }, new Map<string, Date>());
}

async function sendAiDigestToUser(user: DbUser): Promise<void> {
  const context = computeContextFromUser({ user, isSSR: false });
  const result = await generateAiDigestPostSelection({
    user,
    context,
    options: { trigger: "scheduled" },
  });
  const { issueId, spec } = result;
  if (!issueId) {
    throw new Error(`Scheduled AI digest for ${user._id} was not persisted`);
  }
  const sent = await wrapAndSendEmail({
    user,
    subject: spec.subject,
    body: aiDigestEmailBody(spec),
    // The click-history join in aiDigestHistory.ts matches on exactly these
    // three values, so they are load-bearing rather than incidental metadata.
    tracking: {
      emailType: AI_DIGEST_EMAIL_TYPE,
      campaignId: issueId,
      recipientId: user._id,
    },
  });
  if (!sent) {
    throw new Error(`Failed to send scheduled AI digest issue ${issueId} to ${user._id}`);
  }
  await AiDigestIssues.rawUpdateOne(
    { _id: issueId },
    { $set: { emailedAt: new Date() } },
  );
  await createNotification({
    userId: user._id,
    notificationType: "aiDigestReady",
    documentType: null,
    documentId: null,
    extraData: { issueId, subject: spec.subject },
    context,
  });
}

export async function sendScheduledAiDigestEmails(now = new Date()): Promise<void> {
  if (!aiDigestScheduledEmailsEnabledSetting.get()) {
    return;
  }
  const cadenceDays = aiDigestEmailCadenceDaysSetting.get();
  const subscribers = await loadAiDigestSubscribers();
  const lastScheduledIssueAt = await loadLastScheduledIssueAt(
    subscribers.map((user) => user._id),
    aiDigestSendDueBefore(now, cadenceDays),
  );
  const dueUsers = subscribers
    .filter((user) => isAiDigestSendDue({
      lastScheduledIssueAt: lastScheduledIssueAt.get(user._id) ?? null,
      cadenceDays,
      now,
    }))
    .slice(0, AI_DIGEST_SCHEDULED_SENDS_PER_RUN);

  for (const user of dueUsers) {
    // One reader's failed generation or send must not block the others. A
    // failure before the issue is persisted is simply retried next hour.
    try {
      await sendAiDigestToUser(user);
    } catch (error) {
      captureException(error);
      // eslint-disable-next-line no-console
      console.error(`Scheduled AI digest failed for user ${user._id}`, error);
    }
  }
}
