import { executePromiseQueue } from "@/lib/utils/asyncUtils";
import { hashPostText } from "@/lib/collections/postEmbeddings/helpers";
import { postStatuses } from "@/lib/collections/posts/constants";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { updatePostEmbeddings } from "@/server/embeddings";

/* eslint-disable no-console */

// Regenerates the embeddings of published, non-rejected posts whose embedding
// was generated from the empty string even though the post has text. That
// happened to posts published while their author was still unreviewed: the
// embedding code read their contents as a logged-out viewer, who isn't allowed
// to see them. Dry-run by default:
//
//   npm run repl -- dev lw packages/lesswrong/scripts/backfillEmptyPostEmbeddings.ts 'backfillEmptyPostEmbeddings()'
//   npm run repl -- dev lw packages/lesswrong/scripts/backfillEmptyPostEmbeddings.ts 'backfillEmptyPostEmbeddings({ dryRun: false })'

const CONCURRENCY = 5;

interface PostToBackfill {
  _id: string;
  title: string;
  postedAt: Date;
}

interface BackfillResult {
  post: PostToBackfill;
  error: string | null;
}

async function getPostsToBackfill(): Promise<PostToBackfill[]> {
  const db = getSqlClientOrThrow();
  return db.any<PostToBackfill>(`
    -- backfillEmptyPostEmbeddings
    SELECT p."_id", p."title", p."postedAt"
    FROM "PostEmbeddings" pe
    JOIN "Posts" p ON p."_id" = pe."postId"
    JOIN "Revisions" r ON r."_id" = p."contents_latest"
    WHERE pe."postHash" = $(emptyTextHash)
      AND NOT p."draft"
      AND NOT p."rejected"
      AND p."status" = $(approvedStatus)
      AND r."wordCount" > 1
    ORDER BY p."postedAt" DESC
  `, { emptyTextHash: hashPostText(""), approvedStatus: postStatuses.STATUS_APPROVED });
}

async function backfillPost(post: PostToBackfill): Promise<BackfillResult> {
  try {
    await updatePostEmbeddings(post._id, "LessWrong");
    return { post, error: null };
  } catch (err) {
    return { post, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function backfillEmptyPostEmbeddings({ dryRun = true, limit }: { dryRun?: boolean, limit?: number } = {}) {
  const posts = await getPostsToBackfill();
  const postsToBackfill = posts.slice(0, limit);
  console.log(`${posts.length} published posts with text have an embedding of the empty string`);
  if (dryRun) {
    for (const post of postsToBackfill) {
      console.log(`${post.postedAt.toISOString()} ${post.title} (${post._id})`);
    }
    console.log(`Dry run: would regenerate ${postsToBackfill.length} embeddings. Pass { dryRun: false } to regenerate them.`);
    return;
  }

  let completed = 0;
  const results = await executePromiseQueue(postsToBackfill.map(post => async () => {
    const result = await backfillPost(post);
    completed++;
    if (completed % 50 === 0) console.log(`${completed}/${postsToBackfill.length} done`);
    return result;
  }), CONCURRENCY);

  const failures = results.filter(({ error }) => error);
  for (const { post, error } of failures) {
    console.log(`FAILED ${post.title} (${post._id}): ${error}`);
  }
  const remaining = await getPostsToBackfill();
  console.log(`Regenerated ${results.length - failures.length} embeddings; ${remaining.length} posts with text still have an embedding of the empty string`);
  if (failures.length) {
    throw new Error(`Regenerating embeddings failed for ${failures.length} of ${results.length} posts`);
  }
}
