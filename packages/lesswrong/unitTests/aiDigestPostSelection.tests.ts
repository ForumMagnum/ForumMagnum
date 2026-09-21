import { findCachedAiDigestPostText } from "@/server/aiDigest/aiDigestPostTextCache";
import type {
  AiDigestPostCandidate,
  AiDigestReaderData,
  AiDigestPostCandidateCard,
  AiDigestQuickTakeCandidate,
  AiDigestSelectedPostCandidate,
} from "@/server/aiDigest/aiDigestPostCandidates";
import {
  aiDigestCandidateExclusionReason,
  aiDigestQuickTakeExclusionReason,
  buildAiDigestReaderContext,
  buildReadShareCalibration,
  deduplicateAuthorSubscriptions,
  isSelectableAiDigestCandidate,
  relaxPreviousInclusionExclusions,
} from "@/server/aiDigest/aiDigestPostCandidates";
import {
  createAiDigestDiscoveredCandidateRegistry,
  registerDiscoveredCandidates,
} from "@/server/aiDigest/aiDigestSelectionTools";
import type { AiDigestPostSummaryRecord } from "@/server/aiDigest/aiDigestPostSummaries";
import { buildAiDigestHistory } from "@/server/aiDigest/aiDigestHistory";
import type {
  AiDigestClickRecord,
  AiDigestIssueRecord,
  AiDigestPastRecommendation,
} from "@/server/aiDigest/aiDigestHistory";
import type {
  AiDigestCandidateAnnotationRow,
  AiDigestPostInteractionRow,
  AiDigestQuickTakeAnnotationRow,
  AiDigestQuickTakeInteractionRow,
  AiDigestSubscribedAuthorRow,
} from "@/server/aiDigest/aiDigestReaderSignals";
import {
  AI_DIGEST_POST_SELECTION_PROMPT_VERSION,
  buildAiDigestPostSelectionPrompt,
} from "@/server/aiDigest/aiDigestPostSelectionPrompt";
import type { AiDigestPostSelectionModelOutput } from "@/server/aiDigest/aiDigestPostSelection";
import {
  AI_DIGEST_SELECTION_LENGTH_LIMITS,
  buildAiDigestSpecFromPostSelection,
  resolveAiDigestSelectionPools,
  sanitizeAiDigestPostSelectionOutput,
  validateAiDigestPostSelectionOutput,
} from "@/server/aiDigest/aiDigestPostSelection";
import {
  sumAiDigestSelectionCostUsd,
} from "@/server/aiDigest/aiDigestSelectionShared";
import type {
  AiDigestPostReferenceRow,
} from "@/server/repos/PostsRepo";

const NOW = new Date("2026-07-17T12:00:00.000Z");

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
    postedAt: new Date(`2026-07-${day}T10:00:00.000Z`),
    occurredAt: new Date(`2026-07-${day}T12:00:00.000Z`),
  };
}

function promptSection(prompt: string, openingTag: string, closingTag: string): string {
  return prompt.split(`${openingTag}\n`)[1]?.split(`\n${closingTag}`)[0] ?? "";
}

function makeReaderData(
  overrides: Partial<AiDigestReaderData> = {},
): AiDigestReaderData {
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
  quickTakeIds: string[] = [],
  discussionCommentIds: string[] = [],
): AiDigestIssueRecord {
  return {
    _id: `issue-${index}`,
    recipientId: "reader-1",
    postIds,
    quickTakeIds,
    discussionCommentIds,
    generatedAt,
    countsTowardHistory,
    selectionModelId: "selection-model",
    promptVersion: "selection-v2",
  };
}

function makeQuickTakeCandidate(index: number): AiDigestQuickTakeCandidate {
  return {
    commentId: `quick-take-${index}`,
    author: `Quick author ${index}`,
    authorId: `quick-author-${index}`,
    publicationDate: `2026-07-${String(index).padStart(2, "0")}T12:00:00.000Z`,
    baseScore: 25 + index,
    body: `A competitive quick take body ${index} that is long enough to read in the corpus.`,
    upvoteStrength: null,
    isSubscribedToAuthor: false,
    previousDigestInclusionCount: 0,
    lastIncludedAt: null,
    exclusionReason: null,
  };
}

function makeValidOutput(): AiDigestPostSelectionModelOutput {
  return {
    selectedItems: [1, 2, 3, 4, 5].map((index) => ({
      itemId: `post-${index}`,
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
      postedAt: new Date("2026-07-10T12:00:00.000Z"),
      occurredAt: new Date("2026-07-15T12:00:00.000Z"),
    };
    const context = buildAiDigestReaderContext(
      { createdAt: new Date("2026-01-01T00:00:00.000Z") },
      makeReaderData({
        recentReads: [postReference],
        recentPositiveVotes: [{
          ...postReference,
          occurredAt: new Date("2026-07-16T12:00:00.000Z"),
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
          createdAt: new Date("2026-07-16T12:00:00.000Z"),
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
      documentType: "post",
      documentId: "post-1",
      subsequentlyRead: false,
      upvoteStrength: "strong",
      upvotedAt: "2026-07-13T12:00:00.000Z",
      clickedAt: null,
    });
    expect(recommendations[1]).toMatchObject({
      documentType: "post",
      documentId: "post-1",
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

describe("AI digest repeat exclusion", () => {
  const previouslyIncluded = {
    previousDigestInclusionCount: 1,
    lastIncludedAt: "2026-07-15T12:00:00.000Z",
  };
  const neverIncluded = {
    previousDigestInclusionCount: 0,
    lastIncludedAt: null,
  };

  function makeCandidateAnnotation(
    overrides: Partial<AiDigestCandidateAnnotationRow> = {},
  ): AiDigestCandidateAnnotationRow {
    return {
      postId: "post-1",
      isSubscribedToAuthor: false,
      isRead: false,
      positivePreferenceStrength: null,
      hasActiveSeeLess: false,
      recipientAuthored: false,
      ...overrides,
    };
  }

  function makeQuickTakeAnnotation(
    overrides: Partial<AiDigestQuickTakeAnnotationRow> = {},
  ): AiDigestQuickTakeAnnotationRow {
    return {
      commentId: "quick-take-1",
      isSubscribedToAuthor: false,
      positivePreferenceStrength: null,
      hasActiveSeeLess: false,
      recipientAuthored: false,
      ...overrides,
    };
  }

  it("excludes posts and quick takes that ran in an earlier issue", () => {
    expect(
      aiDigestCandidateExclusionReason(makeCandidateAnnotation(), false, undefined),
    ).toBeNull();
    expect(
      aiDigestCandidateExclusionReason(makeCandidateAnnotation(), false, neverIncluded),
    ).toBeNull();
    expect(
      aiDigestCandidateExclusionReason(makeCandidateAnnotation(), false, previouslyIncluded),
    ).toBe("previouslyIncluded");
    expect(
      aiDigestQuickTakeExclusionReason(makeQuickTakeAnnotation(), neverIncluded),
    ).toBeNull();
    expect(
      aiDigestQuickTakeExclusionReason(makeQuickTakeAnnotation(), previouslyIncluded),
    ).toBe("previouslyIncluded");
  });

  it("reports the more specific exclusion reason ahead of the repeat rule", () => {
    expect(aiDigestCandidateExclusionReason(
      makeCandidateAnnotation({ recipientAuthored: true }),
      false,
      previouslyIncluded,
    )).toBe("recipientAuthored");
    expect(aiDigestCandidateExclusionReason(
      makeCandidateAnnotation(),
      true,
      previouslyIncluded,
    )).toBe("hiddenByRecipient");
    expect(aiDigestQuickTakeExclusionReason(
      makeQuickTakeAnnotation({ hasActiveSeeLess: true }),
      previouslyIncluded,
    )).toBe("activeSeeLess");
  });

  it("relaxes only the repeat exclusion, keeping the history annotations", () => {
    const [repeated, seeLess] = relaxPreviousInclusionExclusions([
      { ...makeCandidateCard(1), ...previouslyIncluded, exclusionReason: "previouslyIncluded" },
      { ...makeCandidateCard(2), ...previouslyIncluded, exclusionReason: "activeSeeLess" },
    ]);
    expect(repeated.exclusionReason).toBeNull();
    expect(repeated.previousDigestInclusionCount).toBe(1);
    expect(repeated.lastIncludedAt).toBe("2026-07-15T12:00:00.000Z");
    expect(seeLess.exclusionReason).toBe("activeSeeLess");
  });
});

describe("AI digest thin-pool fallback", () => {
  function makeRepeatCard(index: number): AiDigestPostCandidateCard {
    return {
      ...makeCandidateCard(index),
      previousDigestInclusionCount: 1,
      lastIncludedAt: "2026-07-15T12:00:00.000Z",
      exclusionReason: "previouslyIncluded",
    };
  }

  function makeFreshCard(index: number): AiDigestPostCandidateCard {
    return {
      ...makeCandidateCard(index),
      previousDigestInclusionCount: 0,
      lastIncludedAt: null,
      exclusionReason: null,
    };
  }

  it("keeps repeats excluded while the pool can still fill a slate", () => {
    const pools = resolveAiDigestSelectionPools(
      [...[1, 2, 3, 4, 5].map(makeFreshCard), makeRepeatCard(6)],
      [makeQuickTakeCandidate(1)],
    );
    expect(pools.relaxedPreviousInclusions).toBe(false);
    expect(pools.selectableCandidateCards.map((card) => card.postId)).toEqual([
      "post-1",
      "post-2",
      "post-3",
      "post-4",
      "post-5",
    ]);
  });

  it("drops repeat exclusions when too few candidates remain", () => {
    const quickTakes = [1, 2].map((index) => ({
      ...makeQuickTakeCandidate(index),
      previousDigestInclusionCount: 1,
      lastIncludedAt: "2026-07-15T12:00:00.000Z",
      exclusionReason: "previouslyIncluded" as const,
    }));
    const pools = resolveAiDigestSelectionPools(
      [makeFreshCard(1), ...[2, 3, 4].map(makeRepeatCard)],
      quickTakes,
    );
    expect(pools.relaxedPreviousInclusions).toBe(true);
    expect(pools.selectableCandidateCards).toHaveLength(4);
    expect(pools.selectableQuickTakes).toHaveLength(2);
    expect(pools.candidateCards.every((card) => !card.exclusionReason)).toBe(true);
  });

  it("leaves other exclusion reasons in place even when the pool is thin", () => {
    const pools = resolveAiDigestSelectionPools(
      [
        makeFreshCard(1),
        { ...makeFreshCard(2), exclusionReason: "activeSeeLess" },
        makeRepeatCard(3),
      ],
      [],
    );
    expect(pools.relaxedPreviousInclusions).toBe(true);
    expect(pools.selectableCandidateCards.map((card) => card.postId)).toEqual([
      "post-1",
      "post-3",
    ]);
  });

  it("does not claim a relaxation when the pool is thin for other reasons", () => {
    const pools = resolveAiDigestSelectionPools([makeFreshCard(1)], []);
    expect(pools.relaxedPreviousInclusions).toBe(false);
    expect(pools.selectableCandidateCards).toHaveLength(1);
  });
});

describe("AI digest summary cache", () => {
  const candidate = makeCandidate(1);
  const cachedSummary: AiDigestPostSummaryRecord = {
    postId: candidate.postId,
    revisionId: candidate.revisionId,
    summary: "A cached summary that is long enough to satisfy the configured summary limits.",
    modelId: "summary-model",
    promptVersion: "summary-v1",
  };

  it("reuses only the exact revision/model/prompt cache key", () => {
    expect(findCachedAiDigestPostText(
      [candidate],
      [cachedSummary],
      "summary-model",
      "summary-v1",
    ).missingTargets).toEqual([]);
    expect(findCachedAiDigestPostText(
      [candidate],
      [{ ...cachedSummary, revisionId: "old-revision" }],
      "summary-model",
      "summary-v1",
    ).missingTargets).toEqual([candidate]);
    expect(findCachedAiDigestPostText(
      [candidate],
      [cachedSummary],
      "other-model",
      "summary-v1",
    ).missingTargets).toEqual([candidate]);
    expect(findCachedAiDigestPostText(
      [candidate],
      [cachedSummary],
      "summary-model",
      "summary-v2",
    ).missingTargets).toEqual([candidate]);
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
  const cards = [1, 2, 3, 4].map(makeCandidateCard);
  const prompt = buildAiDigestPostSelectionPrompt(readerContext.dossier, cards, [{
    documentType: "post",
    documentId: "earlier-post",
    title: "Earlier recommendation",
    author: "Earlier author",
    publicationDate: "2026-07-01T12:00:00.000Z",
    recommendedAt: "2026-07-10T12:00:00.000Z",
    subsequentlyRead: true,
    upvoteStrength: "regular",
    upvotedAt: "2026-07-11T12:00:00.000Z",
    clickedAt: "2026-07-10T12:00:00.000Z",
  }], "Prioritize decision theory and avoid introductory AI safety posts.", NOW);

  it("serializes compact tuples inside explicit untrusted delimiters", () => {
    expect(prompt.sharedPrefix).toContain("<UNTRUSTED_CANDIDATE_CORPUS>");
    expect(prompt.prompt).toContain("<UNTRUSTED_READER_PROFILE>");
    expect(prompt.prompt).toContain("</UNTRUSTED_READER_PROFILE>");
    expect(prompt.prompt).toContain("<UNTRUSTED_READER_INSTRUCTIONS>");
    expect(prompt.prompt).toContain("Prioritize decision theory");
    expect(prompt.prompt).toContain("</UNTRUSTED_READER_INSTRUCTIONS>");
    expect(prompt.prompt).toContain("<UNTRUSTED_PAST_RECOMMENDATIONS>");
    expect(prompt.prompt).toContain("Earlier recommendation");
    expect(prompt.prompt).not.toContain("earlier-post");
    expect(prompt.prompt).toContain("<UNTRUSTED_CANDIDATE_ANNOTATIONS>");
    expect(prompt.prompt).toContain("Candidate 1");
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

  it("deduplicates repeated recommendation metadata without losing frequency", () => {
    const repeatedRecommendation: AiDigestPastRecommendation = {
      documentType: "post",
      documentId: "earlier-post",
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
    output.selectedItems[0].reason = "Because you liked \\u201CPrediction\\u201D.";
    const sanitized = sanitizeAiDigestPostSelectionOutput(output);
    expect(sanitized.subject).toBe("The Halo Defense — and more");
    expect(sanitized.preheader).toBe("Community dynamics ’ explored");
    expect(sanitized.aiNote).toEqual(["First — paragraph", "No escapes here"]);
    expect(sanitized.selectedItems[0].reason).toBe("Because you liked “Prediction”.");
    expect(sanitized.selectedItems[1]).toEqual(output.selectedItems[1]);
  });

  it("rejects duplicate and unknown post IDs", () => {
    const duplicateOutput = makeValidOutput();
    duplicateOutput.selectedItems[4] = duplicateOutput.selectedItems[0];
    expect(() => validateAiDigestPostSelectionOutput(
      duplicateOutput,
      candidates,
    )).toThrow("distinct");

    const unknownOutput = makeValidOutput();
    unknownOutput.selectedItems[4] = {
      itemId: "post-999",
      reason: "Grounded reason 5",
    };
    expect(() => validateAiDigestPostSelectionOutput(
      unknownOutput,
      candidates,
    )).toThrow("unknown item ID");
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
    output.selectedItems[4] = {
      itemId: discovered.postId,
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
    output.selectedItems[4] = {
      itemId: "post-missing",
      reason: "Grounded reason 5",
    };
    expect(() => validateAiDigestPostSelectionOutput(
      output,
      [...candidates, discovered],
    )).toThrow("unknown item ID");
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
    )).toThrow("ineligible item ID: post-5");
  });

  it("rejects a pick that was already recommended in an earlier issue", () => {
    const repeatedCandidates: AiDigestPostCandidateCard[] = candidates.map((candidate) =>
      candidate.postId === "post-3"
        ? {
          ...candidate,
          previousDigestInclusionCount: 1,
          lastIncludedAt: "2026-07-15T12:00:00.000Z",
          exclusionReason: "previouslyIncluded" as const,
        }
        : candidate);
    expect(() => validateAiDigestPostSelectionOutput(
      makeValidOutput(),
      repeatedCandidates,
    )).toThrow("ineligible item ID: post-3");
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
    unconstrainedOutput.selectedItems[0].reason = "You upvoted a related post.";
    expect(validateAiDigestPostSelectionOutput(
      unconstrainedOutput,
      candidates,
    )).toBe(unconstrainedOutput);
  });

  it("includes the reader's personal instructions in the assembled issue", () => {
    const spec = buildAiDigestSpecFromPostSelection({
      recipientName: "Developer",
      modelLabel: "Test Model",
      personalInstructions: "More decision theory, please.",
      output: makeValidOutput(),
      postCandidates: candidates,
    });
    expect(spec.personalInstructions).toBe("More decision theory, please.");
  });

  it("maps positions to placements without appending fixture sections", () => {
    const output = makeValidOutput();
    validateAiDigestPostSelectionOutput(output, candidates);
    const spec = buildAiDigestSpecFromPostSelection({
      recipientName: "Developer",
      modelLabel: "Test Model",
      personalInstructions: null,
      output,
      postCandidates: candidates,
    });
    expect(spec.aiNote).toEqual({
      modelName: "Test Model",
      paragraphs: output.aiNote,
    });
    expect(spec.personalInstructions).toBeUndefined();
    const recommendations = spec.sections.find(
      (section) => section.kind === "recommendations",
    );
    expect(recommendations?.items).toHaveLength(5);
    expect(recommendations?.items.map((item) => item.placement)).toEqual([
      "headline",
      "headline",
      "compact",
      "compact",
      "compact",
    ]);
    expect(spec.sections.map((section) => section.kind)).toEqual(["recommendations"]);
  });

  it("attaches cleaned previews to the posts that have one", () => {
    const spec = buildAiDigestSpecFromPostSelection({
      recipientName: "Developer",
      modelLabel: "Test Model",
      personalInstructions: null,
      output: makeValidOutput(),
      postCandidates: candidates,
      previewHtmlByPostId: new Map([["post-1", "<p>The opening of the post.</p>"]]),
    });
    const recommendations = spec.sections.find(
      (section) => section.kind === "recommendations",
    );
    expect(recommendations?.items.map((item) => item.previewHtml)).toEqual([
      "<p>The opening of the post.</p>",
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("lists recently curated posts as quiet items, deduped against selections", () => {
    const output = makeValidOutput();
    const spec = buildAiDigestSpecFromPostSelection({
      recipientName: "Developer",
      modelLabel: "Test Model",
      personalInstructions: null,
      output,
      postCandidates: candidates,
      curatedPosts: [
        { postId: "curated-1", isRead: true },
        { postId: "post-1", isRead: false },
        { postId: "curated-2", isRead: false },
      ],
    });
    const curated = spec.sections.find((section) => section.kind === "curated");
    expect(curated?.title).toBe("Recently curated");
    expect(curated?.items).toEqual([
      {
        documentRef: { documentType: "post", documentId: "curated-2" },
        placement: "quiet",
        isRead: false,
      },
      {
        documentRef: { documentType: "post", documentId: "curated-1" },
        placement: "quiet",
        isRead: true,
      },
    ]);
  });

  it("fills the curated module with read posts when there are too few unread ones", () => {
    const spec = buildAiDigestSpecFromPostSelection({
      recipientName: "Developer",
      modelLabel: "Test Model",
      personalInstructions: null,
      output: makeValidOutput(),
      postCandidates: candidates,
      curatedPosts: [
        { postId: "curated-1", isRead: true },
        { postId: "curated-2", isRead: true },
        { postId: "curated-3", isRead: false },
        { postId: "curated-4", isRead: true },
      ],
    });
    const curated = spec.sections.find((section) => section.kind === "curated");
    expect(curated?.items).toEqual([
      {
        documentRef: { documentType: "post", documentId: "curated-3" },
        placement: "quiet",
        isRead: false,
      },
      {
        documentRef: { documentType: "post", documentId: "curated-1" },
        placement: "quiet",
        isRead: true,
      },
      {
        documentRef: { documentType: "post", documentId: "curated-2" },
        placement: "quiet",
        isRead: true,
      },
    ]);
  });

  it("caps the curated module at the three most recent unread curated posts", () => {
    const spec = buildAiDigestSpecFromPostSelection({
      recipientName: "Developer",
      modelLabel: "Test Model",
      personalInstructions: null,
      output: makeValidOutput(),
      postCandidates: candidates,
      curatedPosts: [
        { postId: "curated-1", isRead: false },
        { postId: "curated-2", isRead: true },
        { postId: "curated-3", isRead: false },
        { postId: "curated-4", isRead: false },
        { postId: "curated-5", isRead: false },
      ],
    });
    const curated = spec.sections.find((section) => section.kind === "curated");
    expect(curated?.items.map((item) => item.documentRef.documentId)).toEqual([
      "curated-1",
      "curated-3",
      "curated-4",
    ]);
    expect(curated?.items.every((item) => !item.isRead)).toBe(true);
  });

  it("falls back to the three most recently curated posts when all are read", () => {
    const spec = buildAiDigestSpecFromPostSelection({
      recipientName: "Developer",
      modelLabel: "Test Model",
      personalInstructions: null,
      output: makeValidOutput(),
      postCandidates: candidates,
      curatedPosts: [
        { postId: "curated-1", isRead: true },
        { postId: "curated-2", isRead: true },
        { postId: "curated-3", isRead: true },
        { postId: "curated-4", isRead: true },
      ],
    });
    const curated = spec.sections.find((section) => section.kind === "curated");
    expect(curated?.items).toEqual([
      {
        documentRef: { documentType: "post", documentId: "curated-1" },
        placement: "quiet",
        isRead: true,
      },
      {
        documentRef: { documentType: "post", documentId: "curated-2" },
        placement: "quiet",
        isRead: true,
      },
      {
        documentRef: { documentType: "post", documentId: "curated-3" },
        placement: "quiet",
        isRead: true,
      },
    ]);
  });

  it("omits the curated section when nothing was recently curated", () => {
    const spec = buildAiDigestSpecFromPostSelection({
      recipientName: "Developer",
      modelLabel: "Test Model",
      personalInstructions: null,
      output: makeValidOutput(),
      postCandidates: candidates,
      curatedPosts: [],
    });
    expect(spec.sections.some((section) => section.kind === "curated")).toBe(false);
  });

  it("accepts a mixed slate with quick takes only in slots 3-5", () => {
    const quickTakes = [1, 2].map(makeQuickTakeCandidate);
    const mixedOutput = makeValidOutput();
    mixedOutput.selectedItems[2] = {
      itemId: "quick-take-1",
      reason: "Because you follow Quick author 1",
    };
    mixedOutput.selectedItems[4] = {
      itemId: "quick-take-2",
      reason: "One of the most appreciated quick takes this week",
    };
    expect(validateAiDigestPostSelectionOutput(
      mixedOutput,
      candidates,
      quickTakes,
    )).toBe(mixedOutput);
    const spec = buildAiDigestSpecFromPostSelection({
      recipientName: "Developer",
      modelLabel: "Test Model",
      personalInstructions: null,
      output: mixedOutput,
      postCandidates: candidates,
      quickTakeCandidates: quickTakes,
    });
    const recommendations = spec.sections.find(
      (section) => section.kind === "recommendations",
    );
    expect(recommendations?.items.map((item) => item.documentRef.documentType)).toEqual([
      "post",
      "post",
      "quickTake",
      "post",
      "quickTake",
    ]);
    expect(recommendations?.items[2]).toMatchObject({
      documentRef: { documentType: "quickTake", documentId: "quick-take-1" },
      placement: "full",
    });
  });

  it("rejects quick takes in headline slots, too many quick takes, and unknown comment ids", () => {
    const quickTakes = [1, 2, 3].map(makeQuickTakeCandidate);
    const headlineQuickTake = makeValidOutput();
    headlineQuickTake.selectedItems[0] = {
      itemId: "quick-take-1",
      reason: "Because you follow Quick author 1",
    };
    expect(() => validateAiDigestPostSelectionOutput(
      headlineQuickTake,
      candidates,
      quickTakes,
    )).toThrow("slots 1 and 2 must be posts");

    const tooManyQuickTakes = makeValidOutput();
    tooManyQuickTakes.selectedItems[2] = { itemId: "quick-take-1", reason: "Reason 3" };
    tooManyQuickTakes.selectedItems[3] = { itemId: "quick-take-2", reason: "Reason 4" };
    tooManyQuickTakes.selectedItems[4] = { itemId: "quick-take-3", reason: "Reason 5" };
    expect(() => validateAiDigestPostSelectionOutput(
      tooManyQuickTakes,
      candidates,
      quickTakes,
    )).toThrow("at most 2 quick takes");

    const unknownQuickTake = makeValidOutput();
    unknownQuickTake.selectedItems[4] = {
      itemId: "quick-take-missing",
      reason: "Grounded reason 5",
    };
    expect(() => validateAiDigestPostSelectionOutput(
      unknownQuickTake,
      candidates,
      quickTakes,
    )).toThrow("unknown item ID");
  });

  it("counts quickTakeIds for repeat-avoidance and reply outcomes after recommendation", () => {
    const recommendedAt = new Date("2026-07-10T12:00:00.000Z");
    const issues = [
      makeIssue(1, recommendedAt, ["post-1"], true, ["quick-take-1"]),
    ];
    const history = buildAiDigestHistory(issues, [], [], [{
      commentId: "quick-take-1",
      author: "Quick author 1",
      publicationDate: new Date("2026-07-01T12:00:00.000Z"),
      revisionHtml: "<p>A short quick take about decision theory.</p>",
      positivePreferenceStrength: "regular",
      positivePreferenceAt: new Date("2026-07-11T12:00:00.000Z"),
      repliedAt: new Date("2026-07-12T12:00:00.000Z"),
    } satisfies AiDigestQuickTakeInteractionRow]);
    expect(history.postHistoryById.get("quick-take-1")).toEqual({
      previousDigestInclusionCount: 1,
      lastIncludedAt: recommendedAt.toISOString(),
    });
    expect(history.pastRecommendations).toEqual([
      expect.objectContaining({
        documentType: "quickTake",
        documentId: "quick-take-1",
        subsequentlyReplied: true,
        upvoteStrength: "regular",
        upvotedAt: "2026-07-11T12:00:00.000Z",
      }),
    ]);

    const tooEarly = buildAiDigestHistory(issues, [], [], [{
      commentId: "quick-take-1",
      author: "Quick author 1",
      publicationDate: new Date("2026-07-01T12:00:00.000Z"),
      revisionHtml: "<p>A short quick take about decision theory.</p>",
      positivePreferenceStrength: "regular",
      positivePreferenceAt: new Date("2026-07-09T12:00:00.000Z"),
      repliedAt: new Date("2026-07-09T12:00:00.000Z"),
    }]);
    expect(tooEarly.pastRecommendations[0]).toMatchObject({
      subsequentlyReplied: false,
      upvoteStrength: null,
      upvotedAt: null,
    });
  });

  it("serializes quick takes in the shared corpus and past-recommendation rows", () => {
    const readerContext = buildAiDigestReaderContext(
      { createdAt: new Date("2026-01-01T00:00:00.000Z") },
      makeReaderData(),
      NOW,
    );
    const cards = [makeCandidateCard(1)];
    const quickTakes = [makeQuickTakeCandidate(1)];
    const prompt = buildAiDigestPostSelectionPrompt(
      readerContext.dossier,
      cards,
      [{
        documentType: "quickTake",
        documentId: "quick-take-1",
        bodySnippet: "A short quick take about decision theory.",
        author: "Quick author 1",
        publicationDate: "2026-07-01T12:00:00.000Z",
        recommendedAt: "2026-07-10T12:00:00.000Z",
        subsequentlyReplied: true,
        upvoteStrength: null,
        upvotedAt: null,
        clickedAt: null,
      }],
      null,
      NOW,
      quickTakes,
    );
    expect(prompt.promptVersion).toBe(AI_DIGEST_POST_SELECTION_PROMPT_VERSION);
    expect(prompt.sharedPrefix).toContain("<UNTRUSTED_QUICK_TAKE_CORPUS>");
    expect(prompt.sharedPrefix).toContain('"commentId"');
    expect(prompt.sharedPrefix).toContain("quick-take-1");
    expect(prompt.prompt).toContain('"quickTake"');
    expect(prompt.prompt).toContain("repliedAfterRecommendation");
    expect(prompt.system).toContain("At most two of the five items may be quick takes");
  });
});
