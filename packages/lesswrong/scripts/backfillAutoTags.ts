import countBy from "lodash/countBy";
import { asyncFilter, executePromiseQueue } from "@/lib/utils/asyncUtils";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { createAdminContext } from "@/server/vulcan-lib/createContexts";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { postIsPubliclyVisible } from "@/server/permissions/accessFilters";
import { getAutoTagsToApply, getTagBotAccount, isAutoTaggablePost } from "@/server/languageModels/autoTagCallbacks";
import { addOrUpvoteTag } from "@/server/tagging/tagsGraphQL";

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

const BACKFILL_SINCE = new Date("2026-01-01T00:00:00Z");
const CONCURRENCY = 8;

interface BackfillResult {
  post: DbPost;
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

async function backfillPost(post: DbPost, tagBot: DbUser): Promise<BackfillResult> {
  const context = computeContextFromUser({ user: tagBot, isSSR: false, forumType: "LessWrong" });
  try {
    const tags = await getAutoTagsToApply(post, context);
    for (const tag of tags) {
      await addOrUpvoteTag({ tagId: tag._id, postId: post._id, currentUser: tagBot, context, backfilled: true });
    }
    return { post, appliedTagNames: tags.map(tag => tag.name), error: null };
  } catch (err) {
    return { post, appliedTagNames: [], error: err instanceof Error ? err.message : String(err) };
  }
}

export async function backfillAutoTags({ dryRun = true, limit }: { dryRun?: boolean, limit?: number } = {}) {
  const adminContext = createAdminContext({ forumType: "LessWrong" });
  const tagBot = await getTagBotAccount(adminContext);
  if (!tagBot) throw new Error("No tag-bot account is configured");

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

  console.log(`Classifying and tagging ${postsToTag.length} posts...`);
  let completed = 0;
  const results = await executePromiseQueue(postsToTag.map(post => async () => {
    const result = await backfillPost(post, tagBot);
    completed++;
    if (completed % 25 === 0) console.log(`${completed}/${postsToTag.length} done`);
    return result;
  }), CONCURRENCY);

  const failures = results.filter(({ error }) => error);
  const untagged = results.filter(({ appliedTagNames, error }) => !error && !appliedTagNames.length);
  console.log(`Tags applied: ${JSON.stringify(countBy(results.flatMap(({ appliedTagNames }) => appliedTagNames)))}`);
  console.log(`${untagged.length} posts got no core tags`);
  for (const { post, error } of failures) {
    console.log(`FAILED ${post.title} (${post._id}): ${error}`);
  }
  if (failures.length) {
    throw new Error(`Auto-tagging failed for ${failures.length} of ${results.length} posts`);
  }
}
