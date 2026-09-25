import "./integrationTestSetup";
import { randomId } from "@/lib/random";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import CommentsRepo from "@/server/repos/CommentsRepo";
import PostEmbeddingsRepo from "@/server/repos/PostEmbeddingsRepo";
import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";
import { clearAiDigestRecommendationHistory } from "@/server/aiDigest/aiDigestHistory";

// Raw fixtures deliberately bypass callbacks: these tests exercise query eligibility,
// not publishing, notifications, embedding generation, or provider calls.
async function insertPost({
  id = randomId(),
  postedAt = new Date(),
  shortform = false,
  draft = false,
  unlisted = false,
}: {
  id?: string;
  postedAt?: Date;
  shortform?: boolean;
  draft?: boolean;
  unlisted?: boolean;
} = {}): Promise<string> {
  await getSqlClientOrThrow().none(`
    INSERT INTO "Posts" (
      "_id", slug, title, "postedAt", "lastCommentedAt", status, "isFuture",
      "userId", "baseScore", "maxBaseScore", shortform, draft, unlisted
    ) VALUES ($1, $1, $1, $2, $2, 2, FALSE, 'digest-test-author', 50, 50, $3, $4, $5)
  `, [id, postedAt, shortform, draft, unlisted]);
  return id;
}

it("includes public shortform discussions in both pools while excluding private and deleted content", async () => {
  const userId = randomId();
  const visibleThreads: string[] = [];
  const hiddenThreads: string[] = [];
  for (const variant of ["regular", "shortform", "draft", "unlisted", "deleted"] as const) {
    const postId = await insertPost({
      shortform: variant !== "regular",
      draft: variant === "draft",
      unlisted: variant === "unlisted",
    });
    const threadId = randomId();
    await getSqlClientOrThrow().none(`
      INSERT INTO "Comments" ("_id", "userId", "postId", "postedAt", "baseScore", deleted)
      VALUES ($1, $2, $3, NOW(), 25, $4)
    `, [threadId, userId, postId, variant === "deleted"]);
    (variant === "regular" || variant === "shortform" ? visibleThreads : hiddenThreads).push(threadId);
  }
  const repo = new CommentsRepo();
  const options = { minPostedAt: new Date(Date.now() - 60_000), limit: 100 };
  const siteWide = await repo.getAiDigestSiteWideThreadRows(options);
  const reader = await repo.getAiDigestReaderThreadRows({ ...options, userId });
  for (const rows of [siteWide, reader]) {
    const ids = rows.map((row) => row.threadId);
    expect(ids).toEqual(expect.arrayContaining(visibleThreads));
    for (const id of hiddenThreads) expect(ids).not.toContain(id);
  }
});

it("finds recent eligible embeddings behind more than 200 closer historical matches", async () => {
  const repo = new PostEmbeddingsRepo();
  const vector = Array<number>(1536).fill(0);
  vector[0] = 0.01;
  // Positive small inner products keep the existing quality formula's distances
  // away from its -0.1 singularity while making historical posts strictly closer.
  for (let index = 0; index < 201; index++) {
    const postId = await insertPost({ postedAt: new Date("2000-01-01") });
    await repo.setPostEmbeddings(postId, "hash", "test-model", vector);
  }
  const recentId = await insertPost();
  await repo.setPostEmbeddings(recentId, "hash", "test-model", Array<number>(1536).fill(0));
  const hiddenId = await insertPost({ draft: true });
  await repo.setPostEmbeddings(hiddenId, "hash", "test-model", vector);
  const recent = await repo.getNearestPostIdsWeightedByQuality(vector, 5, {
    publishedAfter: new Date("2026-01-01"), minKarma: 20,
  });
  expect(recent).toEqual([recentId]);
  const unrestricted = await repo.getNearestPostIdsWeightedByQuality(vector, 5);
  expect(unrestricted).toHaveLength(5);
  expect(unrestricted).not.toContain(recentId);
  expect(unrestricted).not.toContain(hiddenId);
});

it("clears only recommendation participation and retains sent issues", async () => {
  const db = getSqlClientOrThrow();
  const recipientId = randomId();
  const issueId = randomId();
  const oldId = randomId();
  const otherId = randomId();
  const now = new Date();
  for (const [id, recipient, ageDays] of [
    [issueId, recipientId, 0], [oldId, recipientId, 30], [otherId, randomId(), 0],
  ] as const) {
    await db.none(`
      INSERT INTO "AiDigestIssues" ("_id", "recipientId", "createdAt", "emailedAt", trigger, spec)
      VALUES ($1, $2, $3, $3, 'scheduled', '{}')
    `, [id, recipient, new Date(now.getTime() - ageDays * 86_400_000)]);
  }
  expect(await clearAiDigestRecommendationHistory({ recipientId, days: 7, now })).toBe(1);
  expect(await clearAiDigestRecommendationHistory({ recipientId, days: 7, now })).toBe(0);
  const issue = await AiDigestIssues.findOne(issueId);
  expect(issue?.countsTowardHistory).toBe(false);
  expect(issue?.emailedAt).toEqual(now);
  expect(issue?.trigger).toBe("scheduled");
  expect((await AiDigestIssues.findOne(oldId))?.countsTowardHistory).toBe(true);
  expect((await AiDigestIssues.findOne(otherId))?.countsTowardHistory).toBe(true);
});
