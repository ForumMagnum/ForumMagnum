import "./integrationTestSetup";
import { randomId } from "@/lib/random";
import { sleep } from "@/lib/utils/asyncUtils";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import CommentsRepo from "@/server/repos/CommentsRepo";
import PostEmbeddingsRepo from "@/server/repos/PostEmbeddingsRepo";
import PostsRepo from "@/server/repos/PostsRepo";
import AiDigestSchedulesRepo from "@/server/repos/AiDigestSchedulesRepo";
import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";
import AiDigestSchedules from "@/server/collections/aiDigestSchedules/collection";
import LWEvents from "@/server/collections/lwevents/collection";
import UltraFeedEvents from "@/server/collections/ultraFeedEvents/collection";
import Users from "@/server/collections/users/collection";
import { clearAiDigestRecommendationHistory, loadAiDigestHistory } from "@/server/aiDigest/aiDigestHistory";
import { aiDigestEmailBody } from "@/server/emailComponents/AiDigestEmail";
import { AI_DIGEST_UTM_PARAMS } from "@/server/emailComponents/aiDigestEmailLinks";
import { wrapAndRenderEmail } from "@/server/emails/renderEmail";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";

// Raw fixtures deliberately bypass callbacks: these tests exercise query eligibility,
// not publishing, notifications, embedding generation, or provider calls.
async function insertPost({
  id = randomId(),
  postedAt = new Date(),
  userId = "digest-test-author",
  coauthorUserIds = [],
  shortform = false,
  draft = false,
  unlisted = false,
  onlyVisibleToEstablishedAccounts = false,
  disableRecommendation = false,
}: {
  id?: string;
  postedAt?: Date;
  userId?: string;
  coauthorUserIds?: string[];
  shortform?: boolean;
  draft?: boolean;
  unlisted?: boolean;
  onlyVisibleToEstablishedAccounts?: boolean;
  disableRecommendation?: boolean;
} = {}): Promise<string> {
  await getSqlClientOrThrow().none(`
    INSERT INTO "Posts" (
      "_id", slug, title, "postedAt", "lastCommentedAt", status, "isFuture",
      "userId", "coauthorUserIds", "baseScore", "maxBaseScore", shortform, draft, unlisted,
      "onlyVisibleToEstablishedAccounts", "disableRecommendation", "contents_latest"
    ) VALUES ($1, $1, $1, $2, $2, 2, FALSE, $3, $4, 50, 50, $5, $6, $7, $8, $9, $1)
  `, [id, postedAt, userId, coauthorUserIds, shortform, draft, unlisted, onlyVisibleToEstablishedAccounts, disableRecommendation]);
  return id;
}

async function insertUser({ isAdmin = false, emailSubscribedToAiDigest = false } = {}): Promise<DbUser> {
  const id = randomId();
  const email = `${id}@example.com`;
  await getSqlClientOrThrow().none(`
    INSERT INTO "Users" ("_id", slug, username, "displayName", "abTestKey", email, emails, "isAdmin", "emailSubscribedToAiDigest")
    VALUES ($1, $1, $1, $1, $1, $2, ARRAY[$3::JSONB], $4, $5)
  `, [id, email, { address: email, verified: true }, isAdmin, emailSubscribedToAiDigest]);
  const user = await Users.findOne(id);
  if (!user) throw new Error("Failed to insert test user");
  return user;
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
  const siteWide = await repo.getAiDigestSiteWideThreadIds(options);
  const reader = await repo.getAiDigestReaderThreadIds({ ...options, userId });
  for (const ids of [siteWide, reader]) {
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

async function recordSeeLess(userId: string, documentId: string, { cancelled = false } = {}) {
  await UltraFeedEvents.rawInsert({
    userId,
    documentId,
    collectionName: "Posts",
    eventType: "seeLess",
    event: { feedbackReasons: { topic: true }, cancelled },
    feedItemId: null,
  });
}

it("never offers readers their own, hidden, see-less or restricted posts", async () => {
  const reader = await insertUser();
  const eligible = await insertPost();
  const withCancelledSeeLess = await insertPost();
  const excluded = [
    await insertPost({ userId: reader._id }),
    await insertPost({ coauthorUserIds: [reader._id] }),
    await insertPost({ draft: true }),
    await insertPost({ unlisted: true }),
    await insertPost({ onlyVisibleToEstablishedAccounts: true }),
    await insertPost({ disableRecommendation: true }),
  ];
  const hidden = await insertPost();
  const seenLess = await insertPost();
  await Users.rawUpdateOne({ _id: reader._id }, { $set: { hiddenPostsMetadata: [{ postId: hidden }] } });
  await recordSeeLess(reader._id, seenLess);
  await recordSeeLess(reader._id, withCancelledSeeLess, { cancelled: true });

  const candidates = await new PostsRepo().getAiDigestPostCandidates({
    userId: reader._id,
    aboutPostId: randomId(),
    minKarma: 20,
    postIds: [eligible, withCancelledSeeLess, ...excluded, hidden, seenLess],
  });
  expect(candidates.map((candidate) => candidate.postId).sort()).toEqual([eligible, withCancelledSeeLess].sort());
});

it("doesn't let a run claim a reader that another run is claiming", async () => {
  const reader = await insertUser({ isAdmin: true, emailSubscribedToAiDigest: true });
  const repo = new AiDigestSchedulesRepo();
  await repo.addMissingSchedules();
  const claimAll = () => repo.claimDueSchedules({ limit: 1_000, claimDurationMs: 60_000 });
  const claimsReader = (claims: DbAiDigestSchedule[]) => claims.some((schedule) => schedule.userId === reader._id);

  // Another run's claim, left uncommitted while this run claims.
  const otherRun = getSqlClientOrThrow().tx(async (transaction) => {
    await transaction.none(`
      UPDATE "AiDigestSchedules" SET "claimedUntil" = NOW() + INTERVAL '1 hour' WHERE "userId" = $1
    `, [reader._id]);
    await sleep(500);
  });
  await sleep(100);
  const claims = await claimAll();
  await otherRun;
  expect(claimsReader(claims)).toBe(false);

  // A claim held by a run that died lapses, and the reader can be claimed again.
  await AiDigestSchedules.rawUpdateOne({ userId: reader._id }, { $set: { claimedUntil: new Date(Date.now() - 1_000) } });
  expect(claimsReader(await claimAll())).toBe(true);
});

it("attributes a visit from a digest email link to the recommendation it was for", async () => {
  const reader = await insertUser();
  const [first, second, curated] = [await insertPost(), await insertPost(), await insertPost()];
  const spec: AiDigestSpec = {
    recipientName: reader.displayName,
    subject: "Subject",
    preheader: "Preheader",
    aiNote: { modelName: "Model", paragraphs: ["Note"] },
    sections: [
      {
        kind: "recommendations",
        items: [
          { documentRef: { documentType: "post", documentId: first }, placement: "headline", reason: "Reason" },
          { documentRef: { documentType: "post", documentId: second }, placement: "compact", reason: "Reason" },
        ],
      },
      {
        kind: "curated",
        title: "Recently curated",
        items: [{ documentRef: { documentType: "post", documentId: curated }, placement: "quiet" }],
      },
    ],
  };
  const issueId = await AiDigestIssues.rawInsert({
    recipientId: reader._id,
    trigger: "scheduled",
    countsTowardHistory: true,
    spec,
    emailedAt: null,
  });
  const email = await wrapAndRenderEmail({
    forumType: "LessWrong",
    user: reader,
    to: reader.email ?? "",
    subject: spec.subject,
    body: aiDigestEmailBody(spec, issueId),
    utmParams: AI_DIGEST_UTM_PARAMS,
  });
  const titleLinks = [...email.html.matchAll(/href="([^"]+)"/g)]
    .map((match) => new URL(match[1].replace(/&amp;/g, "&")))
    .filter((url) => url.searchParams.get("utm_content")?.endsWith(".title"));
  const titleLinkTo = (postId: string) => {
    const link = titleLinks.find((url) => url.pathname.includes(postId));
    if (!link) throw new Error(`No title link to ${postId}`);
    return link;
  };

  // Visit the second recommendation and the curated post from their title
  // links, recording the links' UTM parameters as the post page does.
  for (const [postId, link] of [[second, titleLinkTo(second)], [curated, titleLinkTo(curated)]] as const) {
    await LWEvents.rawInsert({
      name: "post-view",
      userId: reader._id,
      documentId: postId,
      important: false,
      intercom: false,
      properties: {
        utmCampaign: link.searchParams.get("utm_campaign"),
        utmContent: link.searchParams.get("utm_content"),
      },
    });
  }

  const history = await loadAiDigestHistory(reader._id, computeContextFromUser({ user: reader, isSSR: false }));
  const clickedByTitle = Object.fromEntries(history.pastRecommendations.map((recommendation) => [
    recommendation.type === "post" ? recommendation.title : recommendation.snippet,
    recommendation.recommendations.some((event) => !!event.clickedAt),
  ]));
  // Post titles are their IDs; the curated post isn't a recommendation, so it has no history.
  expect(clickedByTitle).toEqual({ [first]: false, [second]: true });
});
