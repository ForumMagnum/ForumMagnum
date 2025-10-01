/**
 * Backfill rate limit activation events for currently rate-limited users
 *
 * This migration creates rateLimitActivated events for users who are currently
 * subject to automatic rate limits. Going forward, these events will be created
 * automatically when votes cause rate limit thresholds to be crossed.
 */

import { forumSelect } from "@/lib/forumTypeUtils";
import { autoCommentRateLimits, autoPostRateLimits } from "@/lib/rateLimits/constants";
import { getActiveRateLimits, getDownvoteRatio, calculateRecentKarmaInfo } from "@/lib/rateLimits/utils";
import { createAdminContext } from "../vulcan-lib/createContexts";

export const up = async ({db}: MigrationContext) => {
  const context = await createAdminContext();

  // First, delete any existing rate limit events (in case this migration was run before with incorrect data)
  // eslint-disable-next-line no-console
  console.log("Removing any existing rate limit events...");
  const deleteResult = await db.result(`
    DELETE FROM "LWEvents"
    WHERE name IN ('rateLimitActivated', 'rateLimitDeactivated')
  `);
  // eslint-disable-next-line no-console
  console.log(`Removed ${deleteResult.rowCount} existing rate limit events`);

  // Find users who have posted or commented in the last 6 months
  // These are the users who might be subject to rate limits
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const activeUserIds = await db.any<{userId: string}>(`
    SELECT DISTINCT "userId"
    FROM (
      SELECT "userId" FROM "Posts"
      WHERE "postedAt" > $1 AND draft = false AND "isEvent" = false
      UNION
      SELECT "userId" FROM "Comments"
      WHERE "postedAt" > $1 AND draft = false AND "debateResponse" != true
    ) AS active_users
    WHERE "userId" IS NOT NULL
  `, [sixMonthsAgo]);

  // eslint-disable-next-line no-console
  console.log(`Found ${activeUserIds.length} users with recent activity`);

  const commentRateLimits = forumSelect(autoCommentRateLimits);
  const postRateLimits = forumSelect(autoPostRateLimits);

  if (!commentRateLimits || !postRateLimits) {
    // eslint-disable-next-line no-console
    console.log('No auto rate limits configured for this forum');
    return;
  }

  let processedCount = 0;
  let rateLimitedCount = 0;
  let skippedStatic = 0;

  // Process users in batches to avoid memory issues
  const batchSize = 100;
  for (let i = 0; i < activeUserIds.length; i += batchSize) {
    const batch = activeUserIds.slice(i, i + batchSize);
    const userIds = batch.map(row => row.userId);

    // Fetch user data
    const users = await context.Users.find({_id: {$in: userIds}}).fetch();

    for (const user of users) {
      try {
        // Get recent karma info for this user
        const allVotes = await context.repos.votes.getVotesOnRecentContent(user._id);
        const recentKarmaInfo = calculateRecentKarmaInfo(user._id, allVotes);

        const userWithKarmaInfo = {
          ...user,
          recentKarmaInfo
        };

        // Check which rate limits are active for this user
        const activeCommentRateLimits = getActiveRateLimits(userWithKarmaInfo, commentRateLimits);
        const activePostRateLimits = getActiveRateLimits(userWithKarmaInfo, postRateLimits);

        // Get the timestamp of the most recent vote on this user's content
        // This will be stored in the triggeredAt property
        // If no votes are found, skip this user (they shouldn't have active rate limits)
        if (allVotes.length === 0) {
          continue;
        }

        const mostRecentVoteDate = allVotes[0].votedAt;

        // Create activation events for each active rate limit
        // Only create events for rolling and timed rate limits (not static)
        for (const rateLimit of activeCommentRateLimits) {
          // Skip static rate limits - they're always displayed separately
          if (rateLimit.rateLimitCategory === "static") {
            skippedStatic++;
            continue;
          }

          await context.LWEvents.rawInsert({
            name: "rateLimitActivated",
            userId: user._id,
            documentId: null,
            important: true,
            intercom: false,
            properties: {
              actionType: rateLimit.actionType,
              rateLimitType: rateLimit.rateLimitType,
              rateLimitCategory: rateLimit.rateLimitCategory,
              itemsPerTimeframe: rateLimit.itemsPerTimeframe,
              timeframeLength: rateLimit.timeframeLength,
              timeframeUnit: rateLimit.timeframeUnit,
              rateLimitMessage: rateLimit.rateLimitMessage,
              triggeredAt: mostRecentVoteDate.toISOString(),
              backfilled: true // mark as backfilled so we can distinguish from real-time events
            }
          });
          rateLimitedCount++;
        }

        for (const rateLimit of activePostRateLimits) {
          // Skip static rate limits - they're always displayed separately
          if (rateLimit.rateLimitCategory === "static") {
            skippedStatic++;
            continue;
          }

          await context.LWEvents.rawInsert({
            name: "rateLimitActivated",
            userId: user._id,
            documentId: null,
            important: true,
            intercom: false,
            properties: {
              actionType: rateLimit.actionType,
              rateLimitType: rateLimit.rateLimitType,
              rateLimitCategory: rateLimit.rateLimitCategory,
              itemsPerTimeframe: rateLimit.itemsPerTimeframe,
              timeframeLength: rateLimit.timeframeLength,
              timeframeUnit: rateLimit.timeframeUnit,
              rateLimitMessage: rateLimit.rateLimitMessage,
              triggeredAt: mostRecentVoteDate.toISOString(),
              backfilled: true
            }
          });
          rateLimitedCount++;
        }

        processedCount++;
        if (processedCount % 100 === 0) {
          // eslint-disable-next-line no-console
          console.log(`Processed ${processedCount}/${activeUserIds.length} users, found ${rateLimitedCount} active rate limits (skipped ${skippedStatic} static)`);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error processing user ${user._id}:`, error);
        // Continue with next user
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Migration complete: Processed ${processedCount} users, created ${rateLimitedCount} rate limit events (rolling/timed only), skipped ${skippedStatic} static rate limits`);
}

export const down = async ({db}: MigrationContext) => {
  // Remove backfilled rate limit events
  await db.none(`
    DELETE FROM "LWEvents"
    WHERE name IN ('rateLimitActivated', 'rateLimitDeactivated')
      AND properties->>'backfilled' = 'true'
  `);

  // eslint-disable-next-line no-console
  console.log('Removed backfilled rate limit events');
}
