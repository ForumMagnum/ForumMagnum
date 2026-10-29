import countBy from "lodash/countBy";
import { asyncFilter, executePromiseQueue } from "@/lib/utils/asyncUtils";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { createAdminContext } from "@/server/vulcan-lib/createContexts";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { postIsPubliclyVisible } from "@/server/permissions/accessFilters";
import { getAutoTagsToApply, getTagBotAccount, isAutoTaggablePost } from "@/server/languageModels/autoTagCallbacks";
import { addOrUpvoteTag } from "@/server/tagging/tagsGraphQL";
import { applyQuickTakeAutoTags } from "@/server/callbacks/commentCallbackFunctions";
import { commentIsNotPublicForAnyReason } from "@/lib/collections/comments/helpers";

/* eslint-disable no-console */

// Runs the auto-tagger on public posts published since 2026-01-01 that the tag
// bot never tagged, other than events and shortform containers. That covers posts from after OpenAI retired the old
// fine-tuned classifiers (2026-10-23), posts published through new-user
// approval (which the old trigger missed), and posts the old classifiers judged
// to have no core tag. The tags it applies are marked backfilled, so tag
// subscribers aren't notified about old posts. Dry-run by default:
//
//   yarn repl dev lw packages/lesswrong/scripts/backfillAutoTags.ts 'backfillAutoTags()'
//   yarn repl dev lw packages/lesswrong/scripts/backfillAutoTags.ts 'backfillAutoTags({ dryRun: false })'
//
// backfillQuickTakeAutoTags does the same for public quick takes posted since
// 2026-01-01 that have no tags, newest first, so that a limit covers the ones
// still on the frontpage:
//
//   yarn repl dev lw packages/lesswrong/scripts/backfillAutoTags.ts 'backfillQuickTakeAutoTags({ limit: 200 })'

const BACKFILL_SINCE = new Date("2026-01-01T00:00:00Z");
const CONCURRENCY = 8;

interface BackfillTask {
  description: string;
  applyTags: () => Promise<DbTag[]>;
}

interface BackfillResult {
  description: string;
  appliedTagNames: string[];
  error: string | null;
}

async function getPostsToBackfill(tagBot: DbUser, context: ResolverContext): Promise<DbPost[]> {
  const db = getSqlClientOrThrow();
  const candidates = await db.any<DbPost>(`
    -- backfillAutoTags
    SELECT p.*
    FROM "Posts" p
    WHERE p."postedAt" >= $(since)
      AND NOT p."draft"
      AND NOT EXISTS (
        SELECT 1
        FROM "TagRels" tr
        WHERE tr."postId" = p."_id"
          AND (
            tr."userId" = $(tagBotId)
            OR EXISTS (
              SELECT 1
              FROM "Votes" v
              WHERE v."collectionName" = 'TagRels'
                AND v."documentId" = tr."_id"
                AND v."userId" = $(tagBotId)
            )
          )
      )
    ORDER BY p."postedAt"
  `, { since: BACKFILL_SINCE, tagBotId: tagBot._id });
  return asyncFilter(candidates.filter(isAutoTaggablePost), post => postIsPubliclyVisible(post, context));
}

async function getQuickTakesToBackfill(context: ResolverContext): Promise<DbComment[]> {
  const candidates = await context.Comments.find({
    shortform: true,
    parentCommentId: null,
    postedAt: { $gte: BACKFILL_SINCE },
    relevantTagIds: { $size: 0 },
  }, { sort: { postedAt: -1 } }).fetch();
  return candidates.filter(comment => !commentIsNotPublicForAnyReason(comment, context.forumType));
}

async function backfillPost(post: DbPost, tagBot: DbUser): Promise<DbTag[]> {
  const context = computeContextFromUser({ user: tagBot, isSSR: false, forumType: "LessWrong" });
  const tags = await getAutoTagsToApply(post, context);
  for (const tag of tags) {
    await addOrUpvoteTag({ tagId: tag._id, postId: post._id, currentUser: tagBot, context, backfilled: true });
  }
  return tags;
}

async function runBackfillTask({ description, applyTags }: BackfillTask): Promise<BackfillResult> {
  try {
    const tags = await applyTags();
    return { description, appliedTagNames: tags.map(tag => tag.name), error: null };
  } catch (err) {
    return { description, appliedTagNames: [], error: err instanceof Error ? err.message : String(err) };
  }
}

async function runBackfillTasks(tasks: BackfillTask[], documentTypeName: string) {
  console.log(`Classifying and tagging ${tasks.length} ${documentTypeName}...`);
  let completed = 0;
  const results = await executePromiseQueue(tasks.map(task => async () => {
    const result = await runBackfillTask(task);
    completed++;
    if (completed % 25 === 0) console.log(`${completed}/${tasks.length} done`);
    return result;
  }), CONCURRENCY);

  const failures = results.filter(({ error }) => error);
  const untagged = results.filter(({ appliedTagNames, error }) => !error && !appliedTagNames.length);
  console.log(`Tags applied: ${JSON.stringify(countBy(results.flatMap(({ appliedTagNames }) => appliedTagNames)))}`);
  console.log(`${untagged.length} ${documentTypeName} got no core tags`);
  for (const { description, error } of failures) {
    console.log(`FAILED ${description}: ${error}`);
  }
  if (failures.length) {
    throw new Error(`Auto-tagging failed for ${failures.length} of ${results.length} ${documentTypeName}`);
  }
}

async function getTagBotAccountOrThrow(context: ResolverContext): Promise<DbUser> {
  const tagBot = await getTagBotAccount(context);
  if (!tagBot) throw new Error("No tag-bot account is configured");
  return tagBot;
}

export async function backfillAutoTags({ dryRun = true, limit }: { dryRun?: boolean, limit?: number } = {}) {
  const adminContext = createAdminContext({ forumType: "LessWrong" });
  const tagBot = await getTagBotAccountOrThrow(adminContext);

  const posts = await getPostsToBackfill(tagBot, adminContext);
  const postsToTag = posts.slice(0, limit);
  console.log(`${posts.length} public posts since ${BACKFILL_SINCE.toISOString()} have no tags from the tag bot`);
  if (dryRun) {
    for (const post of postsToTag) {
      console.log(`${post.postedAt.toISOString()} ${post.title} (${post._id})`);
    }
    console.log(`Dry run: would classify ${postsToTag.length} posts. Pass { dryRun: false } to apply tags.`);
    return;
  }

  await runBackfillTasks(postsToTag.map(post => ({
    description: `${post.title} (${post._id})`,
    applyTags: () => backfillPost(post, tagBot),
  })), "posts");
}

export async function backfillQuickTakeAutoTags({ dryRun = true, limit }: { dryRun?: boolean, limit?: number } = {}) {
  const adminContext = createAdminContext({ forumType: "LessWrong" });
  await getTagBotAccountOrThrow(adminContext);

  const quickTakes = await getQuickTakesToBackfill(adminContext);
  const quickTakesToTag = quickTakes.slice(0, limit);
  console.log(`${quickTakes.length} public quick takes since ${BACKFILL_SINCE.toISOString()} have no tags`);
  if (dryRun) {
    for (const quickTake of quickTakesToTag) {
      console.log(`${quickTake.postedAt.toISOString()} ${quickTake._id}`);
    }
    console.log(`Dry run: would classify ${quickTakesToTag.length} quick takes. Pass { dryRun: false } to apply tags.`);
    return;
  }

  await runBackfillTasks(quickTakesToTag.map(quickTake => ({
    description: `quick take ${quickTake._id}`,
    applyTags: () => applyQuickTakeAutoTags(quickTake, adminContext),
  })), "quick takes");
}
