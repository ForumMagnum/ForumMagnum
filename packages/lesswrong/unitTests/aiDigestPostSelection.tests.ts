import { postStatuses } from "@/lib/collections/posts/constants";
import type {
  AiDigestPostCandidate,
  AiDigestPostCandidateCard,
  AiDigestPostEligibilityInput,
  AiDigestSelectedPostCandidate,
} from "@/server/aiDigest/aiDigestPostCandidates";
import {
  AI_DIGEST_DEFAULT_CANDIDATE_MAX_AGE_DAYS,
  AI_DIGEST_DEFAULT_MIN_KARMA,
  buildAiDigestPostCandidateCards,
  buildAiDigestReaderContext,
  buildReadShareCalibration,
  deduplicateAuthorSubscriptions,
  getAiDigestPostIneligibilityReason,
  isSelectableAiDigestCandidate,
} from "@/server/aiDigest/aiDigestPostCandidates";
import {
  createAiDigestDiscoveredCandidateRegistry,
  registerDiscoveredCandidates,
} from "@/server/aiDigest/aiDigestSelectionTools";
import {
  AI_DIGEST_DEFAULT_SUMMARY_MODEL_ID,
  AI_DIGEST_POST_SUMMARY_MAX_LENGTH,
  attachCachedAiDigestPostSummaries,
  findCachedAiDigestPostSummaries,
  populateMissingAiDigestPostSummaries,
  validateGeneratedPostSummary,
} from "@/server/aiDigest/aiDigestPostSummaries";
import type {
  CachedAiDigestPostSummary,
  GeneratedAiDigestPostSummary,
  AiDigestSummaryGenerationInput,
} from "@/server/aiDigest/aiDigestPostSummaries";
import {
  AI_DIGEST_HISTORY_ISSUE_LIMIT,
  buildAiDigestHistory,
  selectRecentAiDigestIssues,
} from "@/server/aiDigest/aiDigestHistory";
import type {
  AiDigestClickRecord,
  AiDigestIssueRecord,
  AiDigestPastRecommendation,
} from "@/server/aiDigest/aiDigestHistory";
import {
  AI_DIGEST_POST_SELECTION_PROMPT_VERSION,
  AI_DIGEST_POST_SELECTION_SYSTEM_PROMPT,
  buildAiDigestPostSelectionPrompt,
} from "@/server/aiDigest/aiDigestPostSelectionPrompt";
import type { AiDigestPostSelectionModelOutput } from "@/server/aiDigest/aiDigestPostSelection";
import {
  AI_DIGEST_SELECTION_LENGTH_LIMITS,
  buildAiDigestSelectionMessages,
  buildAiDigestSpecFromPostSelection,
  finalizeAiDigestPostSelection,
  sanitizeAiDigestPostSelectionOutput,
  sumAiDigestSelectionCostUsd,
  validateAiDigestPostSelectionOutput,
} from "@/server/aiDigest/aiDigestPostSelection";
import { rubyAiDigestSpec } from "@/server/emailComponents/AiDigestSpec";
import type {
  AiDigestReaderDataRow,
  AiDigestPostInteractionRow,
  AiDigestPostReferenceRow,
  AiDigestSubscribedAuthorRow,
} from "@/server/repos/PostsRepo";

const NOW = new Date("2026-07-17T12:00:00.000Z");
const MIN_POSTED_AT = new Date("2026-07-03T12:00:00.000Z");

function makeEligibilityInput(
  overrides: Partial<AiDigestPostEligibilityInput> = {},
): AiDigestPostEligibilityInput {
  return {
    postId: "post-1",
    status: postStatuses.STATUS_APPROVED,
    draft: false,
    deletedDraft: false,
    rejected: false,
    isFuture: false,
    unlisted: false,
    authorIsUnreviewed: false,
    onlyVisibleToLoggedIn: false,
    onlyVisibleToEstablishedAccounts: false,
    disableRecommendation: false,
    shortform: false,
    isEvent: false,
    hiddenRelatedQuestion: false,
    groupId: null,
    postCategory: "post",
    question: false,
    debate: false,
    meta: false,
    podcastEpisodeId: null,
    hideAuthor: false,
    frontpageDate: null,
    noIndex: false,
    sticky: false,
    defaultRecommendation: false,
    postedAt: new Date("2026-07-10T12:00:00.000Z"),
    baseScore: 20,
    contentsLatest: "revision-1",
    userId: "author-1",
    coauthorUserIds: [],
    isRead: false,
    isHidden: false,
    hasActiveSeeLess: false,
    ...overrides,
  };
}

function makeCandidate(index: number): AiDigestPostCandidate {
  return {
    postId: `post-${index}`,
    revisionId: `revision-${index}`,
    title: `Candidate ${index}`,
    author: `Author ${index}`,
    authorIds: [`author-${index}`],
    publicationDate: `2026-07-${String(index).padStart(2, "0")}T12:00:00.000Z`,
    baseScore: 20 + index,
    score: 1.5 + index,
    tags: [`Topic ${index}`],
    isCurated: index === 1,
    isSubscribedToAuthor: false,
    isRead: index === 2,
    upvoteStrength: index === 3 ? "strong" : null,
    previousDigestInclusionCount: index === 4 ? 2 : 0,
    lastIncludedAt: index === 4 ? "2026-07-15T12:00:00.000Z" : null,
    exclusionReason: null,
    retrievalProvenance: {
      source: "newsletterRecentPostsSql",
      maxAgeDays: 14,
      minKarma: 20,
    },
  };
}

function makeCandidateCard(index: number): AiDigestPostCandidateCard {
  return {
    ...makeCandidate(index),
    summary: `Summary for candidate ${index}. This is long enough to be a valid reusable summary.`,
    summaryProvenance: {
      revisionId: `revision-${index}`,
      modelId: "summary-model",
      promptVersion: "summary-v1",
    },
  };
}

function makePostReference(index: number): AiDigestPostReferenceRow {
  const day = String((index % 17) + 1).padStart(2, "0");
  return {
    postId: `history-post-${index}`,
    title: `History post ${index}`,
    authorId: `history-author-${index}`,
    authorName: `History author ${index}`,
    postedAt: `2026-07-${day}T10:00:00.000Z`,
    occurredAt: `2026-07-${day}T12:00:00.000Z`,
  };
}

function legacyCandidatePayload(cards: AiDigestPostCandidateCard[]): string {
  return JSON.stringify(cards.map((candidate) => ({
    postId: candidate.postId,
    title: candidate.title,
    author: candidate.author,
    publicationDate: candidate.publicationDate,
    baseScore: candidate.baseScore,
    score: candidate.score,
    tags: candidate.tags,
    summary: candidate.summary,
    isCurated: candidate.isCurated,
    isSubscribedToAuthor: candidate.isSubscribedToAuthor,
    isRead: candidate.isRead,
    upvoteStrength: candidate.upvoteStrength,
    previousDigestInclusionCount: candidate.previousDigestInclusionCount,
    lastIncludedAt: candidate.lastIncludedAt,
    retrievalProvenance: candidate.retrievalProvenance,
    summaryProvenance: {
      modelId: candidate.summaryProvenance.modelId,
      promptVersion: candidate.summaryProvenance.promptVersion,
    },
  })), null, 2);
}

function promptSection(prompt: string, openingTag: string, closingTag: string): string {
  return prompt.split(`${openingTag}\n`)[1]?.split(`\n${closingTag}`)[0] ?? "";
}

function makeReaderData(
  overrides: Partial<AiDigestReaderDataRow> = {},
): AiDigestReaderDataRow {
  return {
    totalReadCount: 3,
    recentReadCount30Days: 2,
    recentReadCount180Days: 3,
    topAuthors: [],
    topTopics: [],
    recentReads: [],
    recentPositiveVotes: [],
    recentAuthoredPosts: [],
    recentCommentedPosts: [],
    readAgeBuckets: {
      under7Days: 1,
      from7To30Days: 1,
      from31To180Days: 1,
      over180Days: 0,
    },
    seeLessFeedback: [],
    subscribedAuthors: [],
    ...overrides,
  };
}

function makeIssue(
  index: number,
  generatedAt: Date,
  postIds: string[] = [`post-${index}`],
  countsTowardHistory = true,
): AiDigestIssueRecord {
  return {
    _id: `issue-${index}`,
    recipientId: "reader-1",
    postIds,
    generatedAt,
    countsTowardHistory,
    selectionModelId: "selection-model",
    promptVersion: "selection-v2",
  };
}

function makeValidOutput(): AiDigestPostSelectionModelOutput {
  return {
    selectedPosts: [1, 2, 3, 4, 5].map((index) => ({
      postId: `post-${index}`,
      reason: `Grounded reason ${index}`,
    })),
    subject: "Candidate 1 — plus four more",
    preheader: "Also Candidate 2 and Candidate 3",
    aiNote: [
      "Your recent reading suggests a current interest in this topic.",
      "This issue includes five distinct treatments.",
    ],
  };
}

const TEST_TOKEN_USAGE = {
  inputTokenCount: 2_000,
  outputTokenCount: 800,
  uncachedInputTokenCount: 500,
  cacheReadInputTokenCount: 1_500,
  cacheWriteInputTokenCount: 0,
};
const TEST_SELECTION_COST_USD = 0.00849;
const TEST_GENERATION_DURATION_MS = 75_000;

describe("AI digest newsletter eligibility policy", () => {
  const options = {
    recipientId: "reader-1",
    aboutPostId: "about-post",
    minPostedAt: MIN_POSTED_AT,
    minKarma: 20,
    now: NOW,
  };

  it("accepts an eligible published post", () => {
    expect(getAiDigestPostIneligibilityReason(makeEligibilityInput(), options)).toBeNull();
  });

  it.each([
    ["notApproved", { status: 1 }],
    ["draft", { draft: true }],
    ["future", { isFuture: true }],
    ["unlisted", { unlisted: true }],
    ["unreviewedAuthor", { authorIsUnreviewed: true }],
    ["establishedAccountsOnly", { onlyVisibleToEstablishedAccounts: true }],
    ["recommendationsDisabled", { disableRecommendation: true }],
    ["aboutPost", { postId: "about-post" }],
    ["shortformContainer", { shortform: true }],
    ["event", { isEvent: true }],
    ["hiddenRelatedQuestion", { hiddenRelatedQuestion: true }],
    ["invalidPublicationDate", { postedAt: null }],
    ["invalidPublicationDate", { postedAt: new Date("2026-07-18T12:00:00.000Z") }],
    ["tooOld", { postedAt: new Date("2026-07-02T12:00:00.000Z") }],
    ["belowKarmaFloor", { baseScore: 19 }],
    ["missingContentsRevision", { contentsLatest: null }],
    ["recipientAuthored", { userId: "reader-1" }],
    ["recipientAuthored", { coauthorUserIds: ["reader-1"] }],
    ["hiddenByRecipient", { isHidden: true }],
    ["activeSeeLess", { hasActiveSeeLess: true }],
  ])("rejects %s posts", (reason, overrides) => {
    expect(
      getAiDigestPostIneligibilityReason(makeEligibilityInput(overrides), options),
    ).toBe(reason);
  });

  it("uses the two-week, 20-karma prototype scope and keeps read posts eligible", () => {
    expect(AI_DIGEST_DEFAULT_CANDIDATE_MAX_AGE_DAYS).toBe(14);
    expect(AI_DIGEST_DEFAULT_MIN_KARMA).toBe(20);
    expect(
      getAiDigestPostIneligibilityReason(
        makeEligibilityInput({ isRead: true }),
        options,
      ),
    ).toBeNull();
  });

  it("does not inherit unrelated default-view or Recombee filters", () => {
    const allowed = makeEligibilityInput({
      deletedDraft: true,
      rejected: true,
      onlyVisibleToLoggedIn: true,
      groupId: "group-1",
      postCategory: "linkpost",
      question: true,
      debate: true,
      meta: true,
      podcastEpisodeId: "podcast-1",
      hideAuthor: true,
      frontpageDate: null,
      noIndex: true,
      sticky: true,
      defaultRecommendation: true,
    });
    expect(getAiDigestPostIneligibilityReason(allowed, options)).toBeNull();
  });
});

describe("AI digest reader dossier", () => {
  it("handles zero and sparse read histories without dividing by zero", () => {
    expect(buildReadShareCalibration(0)).toEqual({
      oneReadPercent: null,
      tenReadsPercent: null,
    });
    expect(buildReadShareCalibration(4)).toEqual({
      oneReadPercent: 25,
      tenReadsPercent: 250,
    });
    expect(buildReadShareCalibration(50_000)).toEqual({
      oneReadPercent: 0.002,
      tenReadsPercent: 0.02,
    });
  });

  it("retains overlapping topic counts without normalizing them to a partition", () => {
    const context = buildAiDigestReaderContext(
      { createdAt: new Date("2026-01-01T00:00:00.000Z") },
      makeReaderData({
        totalReadCount: 3,
        topTopics: [
          { tagId: "tag-1", tagName: "AI safety", readCount: 3 },
          { tagId: "tag-2", tagName: "Governance", readCount: 3 },
        ],
      }),
      NOW,
    );
    expect(context.dossier.affinities.topics.map((topic) => topic.readCount)).toEqual([3, 3]);
  });

  it("merges interactions for one post and uses reader-facing like terminology", () => {
    const postReference = {
      postId: "post-1",
      title: "A liked post",
      authorId: "author-1",
      authorName: "Ada",
      postedAt: "2026-07-10T12:00:00.000Z",
      occurredAt: "2026-07-15T12:00:00.000Z",
    };
    const context = buildAiDigestReaderContext(
      { createdAt: new Date("2026-01-01T00:00:00.000Z") },
      makeReaderData({
        recentReads: [postReference],
        recentPositiveVotes: [{
          ...postReference,
          occurredAt: "2026-07-16T12:00:00.000Z",
          voteStrength: "strong",
        }],
      }),
      NOW,
    );
    expect(context.dossier.recentInteractions.posts).toEqual([{
      postId: "post-1",
      title: "A liked post",
      author: "Ada",
      publicationDate: "2026-07-10",
      lastEngagedAt: "2026-07-16",
      readAt: "2026-07-15",
      likeStrength: "strong",
      likedAt: "2026-07-16",
    }]);
  });

  it("includes the target and reasons for negative preferences", () => {
    const context = buildAiDigestReaderContext(
      { createdAt: new Date("2026-01-01T00:00:00.000Z") },
      makeReaderData({
        seeLessFeedback: [{
          eventId: "event-1",
          collectionName: "Posts",
          documentId: "post-1",
          createdAt: "2026-07-16T12:00:00.000Z",
          targetPostId: "post-1",
          targetTitle: "An unwanted post",
          targetAuthor: "Ada",
          targetTagNames: ["AI safety"],
          feedbackReasons: {
            author: true,
            topic: true,
            text: "Too repetitive",
          },
        }],
      }),
      NOW,
    );
    expect(context.dossier.negativePreferences.items).toEqual([{
      collectionName: "Posts",
      documentId: "post-1",
      feedbackAt: "2026-07-16",
      reasons: ["author", "topic"],
      postId: "post-1",
      title: "An unwanted post",
      author: "Ada",
      topics: ["AI safety"],
      feedbackText: "Too repetitive",
    }]);
  });

  it("collapses positive author subscriptions to one row per author", () => {
    const subscriptions: AiDigestSubscribedAuthorRow[] = [
      { authorId: "author-1", authorName: "Ada" },
      { authorId: "author-1", authorName: "Ada" },
      { authorId: "author-2", authorName: "Ben" },
    ];
    expect(deduplicateAuthorSubscriptions(subscriptions)).toEqual([
      { authorId: "author-1", authorName: "Ada" },
      { authorId: "author-2", authorName: "Ben" },
    ]);
  });
});

describe("AI digest recommendation history", () => {
  it("ignores scratch issues that do not count toward history", () => {
    const countedIssue = makeIssue(
      1,
      new Date("2026-07-10T12:00:00.000Z"),
      ["post-counted"],
    );
    const scratchIssue = makeIssue(
      2,
      new Date("2026-07-11T12:00:00.000Z"),
      ["post-scratch"],
      false,
    );
    const selected = selectRecentAiDigestIssues([countedIssue, scratchIssue]);
    expect(selected.map((issue) => issue._id)).toEqual([countedIssue._id]);

    const history = buildAiDigestHistory([countedIssue, scratchIssue], []);
    expect(history.issues.map((issue) => issue._id)).toEqual([countedIssue._id]);
    expect(history.postHistoryById.has("post-counted")).toBe(true);
    expect(history.postHistoryById.has("post-scratch")).toBe(false);
  });

  it("bounds recent issues and aggregates repeated inclusions", () => {
    const issues = Array.from({ length: AI_DIGEST_HISTORY_ISSUE_LIMIT + 2 }, (_, index) =>
      makeIssue(
        index,
        new Date(`2026-07-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`),
        ["post-repeated"],
      ),
    );
    const bounded = selectRecentAiDigestIssues(issues);
    expect(bounded).toHaveLength(AI_DIGEST_HISTORY_ISSUE_LIMIT);
    expect(bounded[0]._id).toBe(`issue-${AI_DIGEST_HISTORY_ISSUE_LIMIT + 1}`);

    const history = buildAiDigestHistory(bounded, []);
    expect(history.postHistoryById.get("post-repeated")).toEqual({
      previousDigestInclusionCount: AI_DIGEST_HISTORY_ISSUE_LIMIT,
      lastIncludedAt: `2026-07-${String(AI_DIGEST_HISTORY_ISSUE_LIMIT + 2).padStart(2, "0")}T12:00:00.000Z`,
    });
  });

  it("counts only interactions after each recommendation as outcomes", () => {
    const firstRecommendationAt = new Date("2026-07-10T12:00:00.000Z");
    const secondRecommendationAt = new Date("2026-07-12T12:00:00.000Z");
    const issues = [
      makeIssue(2, secondRecommendationAt, ["post-1"]),
      makeIssue(1, firstRecommendationAt, ["post-1"]),
    ];
    const interactions: AiDigestPostInteractionRow[] = [{
      postId: "post-1",
      title: "A prior recommendation",
      author: "Ada",
      publicationDate: new Date("2026-07-01T12:00:00.000Z"),
      isRead: true,
      readAt: new Date("2026-07-11T12:00:00.000Z"),
      positivePreferenceStrength: "strong",
      positivePreferenceAt: new Date("2026-07-13T12:00:00.000Z"),
    }];
    const recommendations = buildAiDigestHistory(issues, interactions).pastRecommendations;
    expect(recommendations).toHaveLength(2);
    expect(recommendations[0]).toMatchObject({
      postId: "post-1",
      subsequentlyRead: false,
      upvoteStrength: "strong",
      upvotedAt: "2026-07-13T12:00:00.000Z",
      clickedAt: null,
    });
    expect(recommendations[1]).toMatchObject({
      postId: "post-1",
      subsequentlyRead: true,
      upvoteStrength: "strong",
      upvotedAt: "2026-07-13T12:00:00.000Z",
      clickedAt: null,
    });
  });

  it("attributes clicks to the issue that produced them, keeping the earliest", () => {
    const firstRecommendationAt = new Date("2026-07-10T12:00:00.000Z");
    const secondRecommendationAt = new Date("2026-07-12T12:00:00.000Z");
    const issues = [
      makeIssue(2, secondRecommendationAt, ["post-1"]),
      makeIssue(1, firstRecommendationAt, ["post-1"]),
    ];
    const interactions: AiDigestPostInteractionRow[] = [{
      postId: "post-1",
      title: "A prior recommendation",
      author: "Ada",
      publicationDate: new Date("2026-07-01T12:00:00.000Z"),
      isRead: false,
      readAt: null,
      positivePreferenceStrength: null,
      positivePreferenceAt: null,
    }];
    const clicks: AiDigestClickRecord[] = [
      {
        campaignId: "issue-1",
        documentId: "post-1",
        occurredAt: new Date("2026-07-10T18:00:00.000Z"),
      },
      {
        campaignId: "issue-1",
        documentId: "post-1",
        occurredAt: new Date("2026-07-10T13:00:00.000Z"),
      },
    ];
    const recommendations = buildAiDigestHistory(
      issues,
      interactions,
      clicks,
    ).pastRecommendations;
    expect(recommendations).toHaveLength(2);
    expect(recommendations[0]).toMatchObject({
      recommendedAt: secondRecommendationAt.toISOString(),
      clickedAt: null,
    });
    expect(recommendations[1]).toMatchObject({
      recommendedAt: firstRecommendationAt.toISOString(),
      clickedAt: "2026-07-10T13:00:00.000Z",
    });
  });
});

describe("AI digest summary cache", () => {
  const candidate = makeCandidate(1);
  const cachedSummary: CachedAiDigestPostSummary = {
    postId: candidate.postId,
    revisionId: candidate.revisionId,
    summary: "A cached summary that is long enough to satisfy the configured summary limits.",
    modelId: "summary-model",
    promptVersion: "summary-v1",
  };

  it("reuses only the exact revision/model/prompt cache key", () => {
    expect(findCachedAiDigestPostSummaries(
      [candidate],
      [cachedSummary],
      "summary-model",
      "summary-v1",
    ).missingTargets).toEqual([]);
    expect(findCachedAiDigestPostSummaries(
      [candidate],
      [{ ...cachedSummary, revisionId: "old-revision" }],
      "summary-model",
      "summary-v1",
    ).missingTargets).toEqual([candidate]);
    expect(findCachedAiDigestPostSummaries(
      [candidate],
      [cachedSummary],
      "other-model",
      "summary-v1",
    ).missingTargets).toEqual([candidate]);
    expect(findCachedAiDigestPostSummaries(
      [candidate],
      [cachedSummary],
      "summary-model",
      "summary-v2",
    ).missingTargets).toEqual([candidate]);
  });

  it("generates and saves a missing summary", async () => {
    const generated: GeneratedAiDigestPostSummary = {
      ...cachedSummary,
      summary: "A newly generated summary that is sufficiently detailed for the recommendation card.",
    };
    const generateSummary = jest.fn(async () => generated);
    const saveSummary = jest.fn(async () => undefined);
    const result = await populateMissingAiDigestPostSummaries({
      targets: [candidate],
      cachedSummaries: [],
      bodiesByRevisionId: new Map([[candidate.revisionId, "A sufficiently long post body."]]),
      modelId: "summary-model",
      promptVersion: "summary-v1",
      dependencies: { generateSummary, saveSummary },
    });
    expect(generateSummary).toHaveBeenCalledTimes(1);
    expect(saveSummary).toHaveBeenCalledWith(generated);
    expect(result.generatedSummaryCount).toBe(1);
    expect(result.summaries[0].summary).toBe(generated.summary);
  });

  it("generates a small batch with bounded concurrency", async () => {
    const targets = [1, 2, 3].map(makeCandidate);
    let activeGenerationCount = 0;
    let maximumActiveGenerationCount = 0;
    const generateSummary = jest.fn(async ({
      target,
      modelId,
      promptVersion,
    }: AiDigestSummaryGenerationInput): Promise<GeneratedAiDigestPostSummary> => {
      activeGenerationCount += 1;
      maximumActiveGenerationCount = Math.max(
        maximumActiveGenerationCount,
        activeGenerationCount,
      );
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 5);
      });
      activeGenerationCount -= 1;
      return {
        postId: target.postId,
        revisionId: target.revisionId,
        summary: `A generated summary for ${target.title} that is long enough to pass validation.`,
        modelId,
        promptVersion,
      };
    });
    const saveSummary = jest.fn(async () => undefined);
    const result = await populateMissingAiDigestPostSummaries({
      targets,
      cachedSummaries: [],
      bodiesByRevisionId: new Map(
        targets.map((target) => [target.revisionId, "A sufficiently long post body."]),
      ),
      modelId: "summary-model",
      promptVersion: "summary-v1",
      concurrency: 2,
      dependencies: { generateSummary, saveSummary },
    });
    expect(result.generatedSummaryCount).toBe(3);
    expect(maximumActiveGenerationCount).toBe(2);
  });

  it("uses only exact cached Fable summaries during selection", () => {
    expect(AI_DIGEST_DEFAULT_SUMMARY_MODEL_ID).toBe("anthropic/claude-fable-5");
    const result = attachCachedAiDigestPostSummaries({
      candidates: [candidate],
      cachedSummaries: [
        cachedSummary,
        {
          ...cachedSummary,
          modelId: AI_DIGEST_DEFAULT_SUMMARY_MODEL_ID,
          revisionId: "old-revision",
        },
      ],
      modelId: AI_DIGEST_DEFAULT_SUMMARY_MODEL_ID,
      promptVersion: "summary-v1",
    });
    expect(result.candidates).toEqual([]);
    expect(result.reusedSummaryCount).toBe(0);
    expect(result.skippedPostCount).toBe(1);
  });

  it("rejects wrong IDs and overlong summaries", () => {
    expect(() => validateGeneratedPostSummary(
      { ...cachedSummary, postId: "invented-post" },
      {
        postId: candidate.postId,
        revisionId: candidate.revisionId,
        modelId: "summary-model",
        promptVersion: "summary-v1",
      },
    )).toThrow("unknown post ID");
    expect(() => validateGeneratedPostSummary(
      { ...cachedSummary, summary: "x".repeat(AI_DIGEST_POST_SUMMARY_MAX_LENGTH + 1) },
      {
        postId: candidate.postId,
        revisionId: candidate.revisionId,
        modelId: "summary-model",
        promptVersion: "summary-v1",
      },
    )).toThrow("Summary length was invalid");
  });
});

describe("AI digest selection prompt", () => {
  const readerContext = buildAiDigestReaderContext(
    { createdAt: new Date("2026-01-01T00:00:00.000Z") },
    makeReaderData({
      topTopics: [{ tagId: "tag-1", tagName: "AI safety", readCount: 3 }],
    }),
    NOW,
  );
  const cards = buildAiDigestPostCandidateCards(
    [1, 2, 3, 4].map(makeCandidateCard),
  );
  const prompt = buildAiDigestPostSelectionPrompt(readerContext.dossier, cards, [{
    postId: "earlier-post",
    title: "Earlier recommendation",
    author: "Earlier author",
    publicationDate: "2026-07-01T12:00:00.000Z",
    recommendedAt: "2026-07-10T12:00:00.000Z",
    subsequentlyRead: true,
    upvoteStrength: "regular",
    upvotedAt: "2026-07-11T12:00:00.000Z",
    clickedAt: "2026-07-10T12:00:00.000Z",
  }], "Prioritize decision theory and avoid introductory AI safety posts.", NOW);

  it("uses the committed prompt version and expected section ordering", () => {
    expect(prompt.promptVersion).toBe(AI_DIGEST_POST_SELECTION_PROMPT_VERSION);
    expect(AI_DIGEST_POST_SELECTION_SYSTEM_PROMPT.indexOf("# Task")).toBeLessThan(
      AI_DIGEST_POST_SELECTION_SYSTEM_PROMPT.indexOf("# Inference policy"),
    );
    expect(AI_DIGEST_POST_SELECTION_SYSTEM_PROMPT.indexOf("# Inference policy")).toBeLessThan(
      AI_DIGEST_POST_SELECTION_SYSTEM_PROMPT.indexOf("# Search tools"),
    );
    expect(AI_DIGEST_POST_SELECTION_SYSTEM_PROMPT.indexOf("# Search tools")).toBeLessThan(
      AI_DIGEST_POST_SELECTION_SYSTEM_PROMPT.indexOf("# Output and copy"),
    );
    expect(prompt.prompt.indexOf("# Shared candidate corpus")).toBeLessThan(
      prompt.prompt.indexOf("# Reader profile"),
    );
    expect(prompt.prompt).toBe(`${prompt.sharedPrefix}\n\n${prompt.personalizedSuffix}`);
  });

  it("serializes compact tuples inside explicit untrusted delimiters", () => {
    expect(prompt.sharedPrefix).toContain("<UNTRUSTED_CANDIDATE_CORPUS>");
    expect(prompt.sharedPrefix).toContain('"asOf":"2026-07-17"');
    expect(prompt.sharedPrefix).toContain(
      '["post-1","Candidate 1","Author 1",16,21,2.5,["Topic 1"],',
    );
    expect(prompt.prompt).toContain("<UNTRUSTED_READER_PROFILE>");
    expect(prompt.prompt).toContain("</UNTRUSTED_READER_PROFILE>");
    expect(prompt.prompt).toContain("<UNTRUSTED_READER_INSTRUCTIONS>");
    expect(prompt.prompt).toContain("Prioritize decision theory");
    expect(prompt.prompt).toContain("</UNTRUSTED_READER_INSTRUCTIONS>");
    expect(prompt.prompt).toContain("<UNTRUSTED_PAST_RECOMMENDATIONS>");
    expect(prompt.prompt).toContain("Earlier recommendation");
    expect(prompt.prompt).toContain('[[7,true,"regular",6,7,1]]');
    expect(prompt.prompt).not.toContain("earlier-post");
    expect(prompt.prompt).toContain("<UNTRUSTED_CANDIDATE_ANNOTATIONS>");
    expect(prompt.prompt).toContain("Candidate 1");
    expect(prompt.prompt).toContain('["post-2",[["alreadyRead"]]]');
    expect(prompt.prompt).toContain('["post-3",[["liked","strong"]]]');
    expect(prompt.prompt).toContain('["post-4",[["previousDigest",2,2]]]');
    expect(prompt.prompt).not.toContain('"summaryModelId"');
    expect(prompt.prompt).not.toContain('"summaryPromptVersion"');
    expect(prompt.prompt).not.toContain('"revisionId"');
    expect(prompt.prompt).not.toContain("sourceMetadata");
    expect(prompt.prompt).not.toContain("retrievalProvenance");
    expect(prompt.prompt).not.toContain('"postId":"post-1"');
    expect(prompt.prompt).not.toContain('"previousDigestInclusionCount"');
  });

  it("keeps the shared prefix identical across readers and annotations", () => {
    const otherReaderContext = buildAiDigestReaderContext(
      { createdAt: new Date("2025-01-01T00:00:00.000Z") },
      makeReaderData({
        totalReadCount: 100,
        topAuthors: [{
          authorId: "author-2",
          authorName: "Author 2",
          readCount: 8,
        }],
      }),
      NOW,
    );
    const otherCards: AiDigestPostCandidateCard[] = cards.map((card) => ({
      ...card,
      isSubscribedToAuthor: card.postId === "post-1",
      isRead: false,
      upvoteStrength: null,
      previousDigestInclusionCount: 0,
      lastIncludedAt: null,
      exclusionReason: card.postId === "post-4" ? "hiddenByRecipient" : null,
    }));
    const otherPrompt = buildAiDigestPostSelectionPrompt(
      otherReaderContext.dossier,
      otherCards,
      [],
      null,
      NOW,
    );

    expect(otherPrompt.sharedPrefix).toBe(prompt.sharedPrefix);
    expect(otherPrompt.personalizedSuffix).not.toBe(prompt.personalizedSuffix);
    expect(otherPrompt.personalizedSuffix).toContain(
      '["post-4",[["excluded","hiddenByRecipient"]]]',
    );
  });

  it("places an Anthropic cache breakpoint after the shared prefix", () => {
    expect(buildAiDigestSelectionMessages({
      sharedPrefix: "shared",
      personalizedSuffix: "personal",
      enableAnthropicCaching: true,
    })).toEqual([{
      role: "user",
      content: [
        {
          type: "text",
          text: "shared",
          providerOptions: {
            anthropic: {
              cacheControl: { type: "ephemeral" },
            },
          },
        },
        { type: "text", text: "\n\npersonal" },
      ],
    }]);
    expect(buildAiDigestSelectionMessages({
      sharedPrefix: "shared",
      personalizedSuffix: "personal",
      enableAnthropicCaching: false,
    })).toEqual([{
      role: "user",
      content: [
        { type: "text", text: "shared" },
        { type: "text", text: "\n\npersonal" },
      ],
    }]);
  });

  it("deduplicates repeated recommendation metadata without losing frequency", () => {
    const repeatedRecommendation: AiDigestPastRecommendation = {
      postId: "earlier-post",
      title: "Earlier recommendation",
      author: "Earlier author",
      publicationDate: "2026-07-01T12:00:00.000Z",
      recommendedAt: "2026-07-10T12:00:00.000Z",
      subsequentlyRead: true,
      upvoteStrength: "regular",
      upvotedAt: "2026-07-11T12:00:00.000Z",
      clickedAt: null,
    };
    const repeatedPrompt = buildAiDigestPostSelectionPrompt(
      readerContext.dossier,
      cards,
      [repeatedRecommendation, repeatedRecommendation],
      null,
      NOW,
    );
    const historyPayload = promptSection(
      repeatedPrompt.prompt,
      "<UNTRUSTED_PAST_RECOMMENDATIONS>",
      "</UNTRUSTED_PAST_RECOMMENDATIONS>",
    );

    expect(historyPayload).toContain('[[7,true,"regular",6,null,2]]');
    expect(historyPayload.split("Earlier recommendation")).toHaveLength(2);
  });

  it("states sparse-user behavior and the simplified output contract", () => {
    expect(prompt.system).toContain("For sparse or new readers");
    expect(prompt.system).toContain("five ranked `selectedPosts`");
    expect(prompt.system).toContain("`aiNote` containing one to three");
    expect(prompt.system).toContain("using supplied `postId` values exactly");
    expect(prompt.system).toContain("Never mention voting mechanics");
    expect(prompt.system).not.toContain("TODO");
    expect(prompt.system).not.toContain("opaque");
    expect(prompt.system).not.toContain("evidence IDs");
    expect(prompt.system.length).toBeLessThan(8_000);
    expect(prompt.prompt.length).toBeLessThan(5_000);
  });

  it("keeps a representative active-reader prompt within its size budget", () => {
    const historyPosts = Array.from({ length: 20 }, (_, index) =>
      makePostReference(index + 1),
    );
    const activeReaderContext = buildAiDigestReaderContext(
      { createdAt: new Date("2015-01-01T00:00:00.000Z") },
      makeReaderData({
        totalReadCount: 50_000,
        recentReadCount30Days: 100,
        recentReadCount180Days: 500,
        topAuthors: Array.from({ length: 15 }, (_, index) => ({
          authorId: `affinity-author-${index}`,
          authorName: `Affinity author ${index}`,
          readCount: 30 - index,
        })),
        topTopics: Array.from({ length: 15 }, (_, index) => ({
          tagId: `topic-${index}`,
          tagName: `Topic ${index}`,
          readCount: 40 - index,
        })),
        recentReads: historyPosts,
        recentPositiveVotes: historyPosts.slice(0, 10).map((post, index) => ({
          ...post,
          voteStrength: index % 2 === 0 ? "strong" : "regular",
        })),
        recentCommentedPosts: historyPosts.slice(0, 5),
        seeLessFeedback: Array.from({ length: 10 }, (_, index) => ({
          eventId: `event-${index}`,
          collectionName: "Posts",
          documentId: `negative-post-${index}`,
          createdAt: `2026-07-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`,
          targetPostId: `negative-post-${index}`,
          targetTitle: `Negative preference post ${index}`,
          targetAuthor: `Negative author ${index}`,
          targetTagNames: [`Negative topic ${index}`],
          feedbackReasons: { topic: true },
        })),
        subscribedAuthors: Array.from({ length: 15 }, (_, index) => ({
          authorId: `followed-author-${index}`,
          authorName: `Followed author ${index}`,
        })),
      }),
      NOW,
    );
    const activeCards = buildAiDigestPostCandidateCards(
      Array.from({ length: 60 }, (_, index) => {
        const candidate = makeCandidateCard(index + 1);
        return {
          ...candidate,
          publicationDate: makePostReference(index + 1).postedAt,
        };
      }),
    );
    const activePrompt = buildAiDigestPostSelectionPrompt(
      activeReaderContext.dossier,
      activeCards,
      [],
      null,
      NOW,
    );
    const compactCandidatePayload = promptSection(
      activePrompt.prompt,
      "<UNTRUSTED_CANDIDATE_CORPUS>",
      "</UNTRUSTED_CANDIDATE_CORPUS>",
    );
    const legacyPayload = legacyCandidatePayload(activeCards);
    const totalCharacterCount = activePrompt.system.length + activePrompt.prompt.length;
    const conservativeTokenEstimate = Math.ceil(totalCharacterCount / 3);

    expect(activeReaderContext.dossier.recentInteractions.posts).toHaveLength(20);
    expect(compactCandidatePayload.length).toBeLessThan(legacyPayload.length * 0.6);
    expect(totalCharacterCount).toBeLessThan(24_000);
    expect(conservativeTokenEstimate).toBeLessThan(8_000);
  });
});

describe("AI digest selection cost tracking", () => {
  it("sums gateway costs across tool-loop steps", () => {
    expect(sumAiDigestSelectionCostUsd([
      { gateway: { cost: "0.00849" } },
      { gateway: { cost: "0.00151" } },
    ])).toBeCloseTo(0.01);
  });

  it("ignores missing or malformed step costs", () => {
    expect(sumAiDigestSelectionCostUsd([
      undefined,
      { gateway: { generationId: "generation-1" } },
      { gateway: { cost: "not-a-number" } },
      { gateway: { cost: "0.0025" } },
    ])).toBe(0.0025);
    expect(sumAiDigestSelectionCostUsd([
      undefined,
      { gateway: { generationId: "generation-2" } },
    ])).toBeNull();
  });
});

describe("AI digest model-output validation and spec mapping", () => {
  const candidates = [1, 2, 3, 4, 5, 6].map((index) => ({
    ...makeCandidateCard(index),
    isRead: false,
    upvoteStrength: null,
    previousDigestInclusionCount: 0,
    lastIncludedAt: null,
    exclusionReason: null,
  }));

  it("decodes stray unicode escape sequences left in model copy", () => {
    const output = makeValidOutput();
    output.subject = "The Halo Defense \\u2014 and more";
    output.preheader = "Community dynamics \\u2019 explored";
    output.aiNote = ["First \\u2014 paragraph", "No escapes here"];
    output.selectedPosts[0].reason = "Because you liked \\u201CPrediction\\u201D.";
    const sanitized = sanitizeAiDigestPostSelectionOutput(output);
    expect(sanitized.subject).toBe("The Halo Defense — and more");
    expect(sanitized.preheader).toBe("Community dynamics ’ explored");
    expect(sanitized.aiNote).toEqual(["First — paragraph", "No escapes here"]);
    expect(sanitized.selectedPosts[0].reason).toBe("Because you liked “Prediction”.");
    expect(sanitized.selectedPosts[1]).toEqual(output.selectedPosts[1]);
  });

  it("rejects duplicate and unknown post IDs", () => {
    const duplicateOutput = makeValidOutput();
    duplicateOutput.selectedPosts[4] = duplicateOutput.selectedPosts[0];
    expect(() => validateAiDigestPostSelectionOutput(
      duplicateOutput,
      candidates,
    )).toThrow("distinct");

    const unknownOutput = makeValidOutput();
    unknownOutput.selectedPosts[4] = {
      postId: "post-999",
      reason: null,
    };
    expect(() => validateAiDigestPostSelectionOutput(
      unknownOutput,
      candidates,
    )).toThrow("unknown post ID");
  });

  it("accepts registry-discovered post IDs without summaries", () => {
    const discovered: AiDigestSelectedPostCandidate = {
      ...makeCandidate(99),
      retrievalProvenance: {
        source: "selectionToolSearch",
        maxAgeDays: null,
        minKarma: 20,
      },
      isRead: false,
      upvoteStrength: null,
      previousDigestInclusionCount: 0,
      lastIncludedAt: null,
      exclusionReason: null,
    };
    const output = makeValidOutput();
    output.selectedPosts[4] = {
      postId: discovered.postId,
      reason: "An older related post from search.",
    };
    expect(validateAiDigestPostSelectionOutput(
      output,
      [...candidates, discovered],
    )).toBe(output);
  });

  it("still rejects unknown IDs when a registry is present", () => {
    const discovered: AiDigestSelectedPostCandidate = {
      ...makeCandidate(99),
      retrievalProvenance: {
        source: "selectionToolSearch",
        maxAgeDays: null,
        minKarma: 20,
      },
      exclusionReason: null,
    };
    const output = makeValidOutput();
    output.selectedPosts[4] = {
      postId: "post-missing",
      reason: null,
    };
    expect(() => validateAiDigestPostSelectionOutput(
      output,
      [...candidates, discovered],
    )).toThrow("unknown post ID");
  });

  it("dedupes discovered candidates against the main corpus", () => {
    const registry = createAiDigestDiscoveredCandidateRegistry();
    const corpusPostIds = new Set(candidates.map((candidate) => candidate.postId));
    const corpusDuplicate = {
      ...makeCandidate(1),
      retrievalProvenance: {
        source: "selectionToolSearch" as const,
        maxAgeDays: null,
        minKarma: 20,
      },
      exclusionReason: null,
    };
    const novel = {
      ...makeCandidate(99),
      retrievalProvenance: {
        source: "selectionToolSearch" as const,
        maxAgeDays: null,
        minKarma: 20,
      },
      exclusionReason: null,
    };
    const registered = registerDiscoveredCandidates(
      registry,
      [corpusDuplicate, novel, novel],
      corpusPostIds,
    );
    expect(registered.map((candidate) => candidate.postId)).toEqual(["post-99"]);
    expect(Array.from(registry.byPostId.keys())).toEqual(["post-99"]);
  });

  it("rejects recipient-excluded candidates", () => {
    const excludedCandidates: AiDigestPostCandidateCard[] = candidates.map((candidate) =>
      candidate.postId === "post-5"
        ? { ...candidate, exclusionReason: "activeSeeLess" }
        : candidate);
    expect(isSelectableAiDigestCandidate(excludedCandidates[4])).toBe(false);
    expect(() => validateAiDigestPostSelectionOutput(
      makeValidOutput(),
      excludedCandidates,
    )).toThrow("ineligible post ID: post-5");
  });

  it("rejects length overruns without constraining recommendation wording", () => {
    const longOutput = makeValidOutput();
    longOutput.subject = "x".repeat(AI_DIGEST_SELECTION_LENGTH_LIMITS.subject + 1);
    expect(() => validateAiDigestPostSelectionOutput(
      longOutput,
      candidates,
    )).toThrow("Subject");

    const longAiNoteOutput = makeValidOutput();
    longAiNoteOutput.aiNote[0] = "x".repeat(
      AI_DIGEST_SELECTION_LENGTH_LIMITS.aiNoteParagraph + 1,
    );
    expect(() => validateAiDigestPostSelectionOutput(
      longAiNoteOutput,
      candidates,
    )).toThrow("AI note paragraph 1");

    const tooManyParagraphsOutput = makeValidOutput();
    tooManyParagraphsOutput.aiNote = ["One", "Two", "Three", "Four"];
    expect(() => validateAiDigestPostSelectionOutput(
      tooManyParagraphsOutput,
      candidates,
    )).toThrow("one to three paragraphs");

    const unconstrainedOutput = makeValidOutput();
    unconstrainedOutput.selectedPosts[0].reason = "You upvoted a related post.";
    expect(validateAiDigestPostSelectionOutput(
      unconstrainedOutput,
      candidates,
    )).toBe(unconstrainedOutput);
  });

  it("persists an ordered issue only after deterministic validation", async () => {
    const generatedAt = new Date("2026-07-17T13:00:00.000Z");
    const persistIssue = jest.fn(async () => "issue-new");
    const finalized = await finalizeAiDigestPostSelection({
      recipientId: "reader-1",
      recipientName: "Developer",
      modelLabel: "Test Model",
      selectionModelId: "selection-model",
      promptVersion: "selection-v2",
      selectionSystemPrompt: "System prompt",
      selectionUserPrompt: "User prompt",
      tokenUsage: TEST_TOKEN_USAGE,
      selectionCostUsd: TEST_SELECTION_COST_USD,
      generatedAt,
      generationDurationMs: TEST_GENERATION_DURATION_MS,
      trigger: "userPreview",
      countsTowardHistory: false,
      personalInstructions: "More decision theory, please.",
      output: makeValidOutput(),
      candidates,
      dependencies: { persistIssue },
    });
    expect(finalized.issueId).toBe("issue-new");
    expect(finalized.spec.personalInstructions).toBe("More decision theory, please.");
    expect(persistIssue).toHaveBeenCalledWith({
      recipientId: "reader-1",
      postIds: ["post-1", "post-2", "post-3", "post-4", "post-5"],
      generatedAt,
      generationDurationMs: TEST_GENERATION_DURATION_MS,
      trigger: "userPreview",
      countsTowardHistory: false,
      personalInstructions: "More decision theory, please.",
      selectionModelId: "selection-model",
      promptVersion: "selection-v2",
      selectionSystemPrompt: "System prompt",
      selectionUserPrompt: "User prompt",
      ...TEST_TOKEN_USAGE,
      selectionCostUsd: TEST_SELECTION_COST_USD,
      spec: finalized.spec,
    });

    persistIssue.mockClear();
    const invalidOutput = makeValidOutput();
    invalidOutput.selectedPosts[4] = invalidOutput.selectedPosts[0];
    await expect(finalizeAiDigestPostSelection({
      recipientId: "reader-1",
      recipientName: "Developer",
      modelLabel: "Test Model",
      selectionModelId: "selection-model",
      promptVersion: "selection-v2",
      selectionSystemPrompt: "System prompt",
      selectionUserPrompt: "User prompt",
      tokenUsage: TEST_TOKEN_USAGE,
      selectionCostUsd: TEST_SELECTION_COST_USD,
      generatedAt,
      generationDurationMs: TEST_GENERATION_DURATION_MS,
      trigger: "userPreview",
      countsTowardHistory: false,
      personalInstructions: "More decision theory, please.",
      output: invalidOutput,
      candidates,
      dependencies: { persistIssue },
    })).rejects.toThrow("distinct");
    expect(persistIssue).not.toHaveBeenCalled();
  });

  it("skips persistence in preview mode and returns a null issueId", async () => {
    const generatedAt = new Date("2026-07-17T13:00:00.000Z");
    const finalized = await finalizeAiDigestPostSelection({
      recipientId: "reader-1",
      recipientName: "Developer",
      modelLabel: "Test Model",
      selectionModelId: "selection-model",
      promptVersion: "selection-v2",
      selectionSystemPrompt: "System prompt",
      selectionUserPrompt: "User prompt",
      tokenUsage: TEST_TOKEN_USAGE,
      selectionCostUsd: TEST_SELECTION_COST_USD,
      generatedAt,
      generationDurationMs: TEST_GENERATION_DURATION_MS,
      trigger: "adminSample",
      countsTowardHistory: true,
      personalInstructions: null,
      output: makeValidOutput(),
      candidates,
      dependencies: {},
    });
    expect(finalized.issueId).toBeNull();
    expect(finalized.selectedCandidates.map((candidate) => candidate.postId)).toEqual([
      "post-1",
      "post-2",
      "post-3",
      "post-4",
      "post-5",
    ]);
    expect(finalized.spec.subject).toBe("Candidate 1 — plus four more");
  });

  it("maps positions to placements and preserves every fixed non-post section", () => {
    const output = makeValidOutput();
    validateAiDigestPostSelectionOutput(output, candidates);
    const spec = buildAiDigestSpecFromPostSelection({
      recipientName: "Developer",
      modelLabel: "Test Model",
      personalInstructions: null,
      output,
      candidates,
    });
    expect(spec.aiNote).toEqual({
      modelName: "Test Model",
      paragraphs: output.aiNote,
    });
    expect(spec.personalInstructions).toBeUndefined();
    const recommendations = spec.sections.find(
      (section) => section.kind === "recommendations",
    );
    expect(recommendations?.items.slice(0, 5).map((item) => item.placement)).toEqual([
      "headline",
      "headline",
      "compact",
      "compact",
      "compact",
    ]);
    expect(recommendations?.items[5]).toEqual(
      rubyAiDigestSpec.sections.find((section) => section.kind === "recommendations")?.items[5],
    );
    expect(spec.sections.filter((section) => section.kind !== "recommendations")).toEqual(
      rubyAiDigestSpec.sections.filter((section) => section.kind !== "recommendations"),
    );
  });
});
