import type { AiDigestThreadCommentRow } from "@/server/repos/CommentsRepo";
import type { AiDigestThreadCommentAnnotationRow } from "@/server/aiDigest/aiDigestReaderSignals";
import {
  AI_DIGEST_THREAD_COMMENT_BODY_MAX_CHARS,
  buildAiDigestThreadAnnotation,
  buildAiDigestThreadCard,
  toThreadCommentReaderFlags,
  type AiDigestThreadAnnotation,
  type AiDigestThreadCandidates,
  type AiDigestThreadCard,
  type AiDigestThreadCommentReaderFlags,
} from "@/server/aiDigest/aiDigestThreadCandidates";
import {
  AI_DIGEST_THREAD_SELECTION_PROMPT_VERSION,
  buildAiDigestThreadSelectionPrompt,
} from "@/server/aiDigest/aiDigestThreadSelectionPrompt";
import {
  AI_DIGEST_MAX_THREAD_COMMENTS_TOTAL,
  AI_DIGEST_THREAD_REASON_MAX_LENGTH,
  clampAiDigestThreadSelectionOutput,
  type AiDigestSelectedThread,
  type AiDigestThreadSelectionModelOutput,
} from "@/server/aiDigest/aiDigestThreadSelection";
import {
  buildAiDigestDiscussionItems,
  buildAiDigestSpecFromPostSelection,
  validateAiDigestPostSelectionOutput,
  type AiDigestPostSelectionModelOutput,
} from "@/server/aiDigest/aiDigestPostSelection";
import type {
  AiDigestPostCandidateCard,
  AiDigestQuickTakeCandidate,
} from "@/server/aiDigest/aiDigestPostCandidates";
import { buildAiDigestReaderContext } from "@/server/aiDigest/aiDigestPostCandidates";
import { buildAiDigestHistory } from "@/server/aiDigest/aiDigestHistory";

const NOW = new Date("2026-07-17T12:00:00.000Z");

function makeThreadCommentRow(
  overrides: Partial<AiDigestThreadCommentRow> & { commentId: string },
): AiDigestThreadCommentRow {
  return {
    threadId: "thread-1",
    parentCommentId: null,
    postId: "post-1",
    postTitle: "A discussed post",
    postBaseScore: 80,
    author: `Author of ${overrides.commentId}`,
    authorId: `author-${overrides.commentId}`,
    publicationDate: new Date("2026-07-15T12:00:00.000Z"),
    baseScore: 10,
    revisionHtml: `<p>Body of ${overrides.commentId}</p>`,
    ...overrides,
  };
}

function makeAnnotation(
  overrides: Partial<AiDigestThreadCommentAnnotationRow> & { commentId: string },
): AiDigestThreadCommentAnnotationRow {
  return {
    authoredByReader: false,
    positivePreferenceStrength: null,
    newSinceLastVisit: false,
    seenInFeed: false,
    hasActiveSeeLess: false,
    onReaderAuthoredPost: false,
    replyToReaderComment: false,
    ...overrides,
  };
}

/** A linear thread: root <- reply-1 <- reply-2 <- ... */
function makeLinearThreadRows(threadId: string, replyCount: number): AiDigestThreadCommentRow[] {
  const root = makeThreadCommentRow({ commentId: threadId, threadId, baseScore: 30 });
  const replies = Array.from({ length: replyCount }, (_, index) =>
    makeThreadCommentRow({
      commentId: `${threadId}-reply-${index + 1}`,
      threadId,
      parentCommentId: index === 0 ? threadId : `${threadId}-reply-${index}`,
      baseScore: replyCount - index,
      publicationDate: new Date(`2026-07-${String(10 + index).padStart(2, "0")}T12:00:00.000Z`),
    }),
  );
  return [root, ...replies];
}

function flagsFromAnnotations(
  annotations: AiDigestThreadCommentAnnotationRow[],
): Map<string, AiDigestThreadCommentReaderFlags> {
  return new Map(annotations.map((annotation) => [
    annotation.commentId,
    toThreadCommentReaderFlags(annotation),
  ]));
}

function makeCandidates({
  siteWideThreads = [],
  readerThreads = [],
  commentFlagsById = new Map(),
  threadAnnotationsById = new Map(),
}: Partial<AiDigestThreadCandidates> = {}): AiDigestThreadCandidates {
  return { siteWideThreads, readerThreads, commentFlagsById, threadAnnotationsById };
}

function cardCommentIds(card: AiDigestThreadCard | null): string[] {
  return card?.comments.map((comment) => comment.commentId) ?? [];
}

describe("AI digest thread card shaping", () => {
  it("skips cyclic branches without losing independent connected comments", () => {
    const card = buildAiDigestThreadCard({
      threadId: "thread-1",
      source: "siteWide",
      rows: [
        makeThreadCommentRow({ commentId: "thread-1" }),
        makeThreadCommentRow({ commentId: "cycle-a", parentCommentId: "cycle-b", baseScore: 100 }),
        makeThreadCommentRow({ commentId: "cycle-b", parentCommentId: "cycle-a", baseScore: 100 }),
        makeThreadCommentRow({ commentId: "self-cycle", parentCommentId: "self-cycle", baseScore: 100 }),
        makeThreadCommentRow({ commentId: "connected", parentCommentId: "thread-1", baseScore: 1 }),
      ],
    });
    expect(cardCommentIds(card)).toEqual(["connected", "thread-1"]);
  });

  it("returns null when the thread root is not among the loaded rows", () => {
    expect(buildAiDigestThreadCard({
      threadId: "thread-1",
      source: "siteWide",
      rows: [makeThreadCommentRow({ commentId: "orphan", parentCommentId: "thread-1" })],
    })).toBeNull();
  });

  it("keeps the root, fills by karma, and pulls in connecting parents", () => {
    const rows = [
      makeThreadCommentRow({ commentId: "thread-1", baseScore: 5 }),
      makeThreadCommentRow({
        commentId: "low-parent",
        parentCommentId: "thread-1",
        baseScore: 1,
      }),
      makeThreadCommentRow({
        commentId: "high-child",
        parentCommentId: "low-parent",
        baseScore: 50,
      }),
      makeThreadCommentRow({
        commentId: "mid-sibling",
        parentCommentId: "thread-1",
        baseScore: 10,
      }),
    ];
    const card = buildAiDigestThreadCard({
      threadId: "thread-1",
      source: "siteWide",
      rows,
      maxComments: 3,
    });
    // high-child (top karma) requires low-parent, filling the 3-comment budget
    // before mid-sibling gets a slot.
    expect(cardCommentIds(card).sort()).toEqual(["high-child", "low-parent", "thread-1"]);
  });

  it("prioritizes reader-flagged comments over higher-karma strangers", () => {
    const rows = [
      makeThreadCommentRow({ commentId: "thread-1", baseScore: 5 }),
      makeThreadCommentRow({
        commentId: "popular",
        parentCommentId: "thread-1",
        baseScore: 90,
      }),
      makeThreadCommentRow({
        commentId: "reader-upvoted",
        parentCommentId: "thread-1",
        baseScore: 2,
      }),
    ];
    const commentFlagsById = flagsFromAnnotations([
      makeAnnotation({ commentId: "reader-upvoted", positivePreferenceStrength: "strong" }),
    ]);
    const card = buildAiDigestThreadCard({
      threadId: "thread-1",
      source: "readerRelevant",
      rows,
      commentFlagsById,
      maxComments: 2,
    });
    expect(cardCommentIds(card).sort()).toEqual(["reader-upvoted", "thread-1"]);
  });

  it("orders card comments chronologically and truncates long bodies", () => {
    const rows = makeLinearThreadRows("thread-1", 2);
    rows[1].revisionHtml = `<p>${"x".repeat(AI_DIGEST_THREAD_COMMENT_BODY_MAX_CHARS + 100)}</p>`;
    const card = buildAiDigestThreadCard({
      threadId: "thread-1",
      source: "siteWide",
      rows,
    });
    // Replies are dated 2026-07-10/11; the root is dated 2026-07-15, so the
    // chronological card order puts the root last.
    expect(cardCommentIds(card)).toEqual([
      "thread-1-reply-1",
      "thread-1-reply-2",
      "thread-1",
    ]);
    const truncatedComment = card?.comments.find(
      (comment) => comment.commentId === "thread-1-reply-1",
    );
    expect(truncatedComment?.truncated).toBe(true);
    expect(truncatedComment?.body).toHaveLength(AI_DIGEST_THREAD_COMMENT_BODY_MAX_CHARS);
    const dates = card?.comments.map((comment) => comment.publicationDate) ?? [];
    expect([...dates].sort()).toEqual(dates);
  });

  it("skips comments whose ancestor chain cannot resolve within the loaded rows", () => {
    const rows = [
      makeThreadCommentRow({ commentId: "thread-1" }),
      makeThreadCommentRow({
        commentId: "dangling",
        parentCommentId: "deleted-comment",
        baseScore: 99,
      }),
    ];
    const card = buildAiDigestThreadCard({
      threadId: "thread-1",
      source: "siteWide",
      rows,
    });
    expect(cardCommentIds(card)).toEqual(["thread-1"]);
  });
});

describe("AI digest thread anchor eligibility and annotations", () => {
  it("maps notification-covered comments to anchor ineligibility reasons", () => {
    expect(toThreadCommentReaderFlags(makeAnnotation({
      commentId: "c1",
      authoredByReader: true,
    })).anchorIneligibilityReason).toBe("readerAuthored");
    expect(toThreadCommentReaderFlags(makeAnnotation({
      commentId: "c2",
      onReaderAuthoredPost: true,
    })).anchorIneligibilityReason).toBe("onReaderPost");
    expect(toThreadCommentReaderFlags(makeAnnotation({
      commentId: "c3",
      replyToReaderComment: true,
    })).anchorIneligibilityReason).toBe("replyToReader");
    expect(toThreadCommentReaderFlags(makeAnnotation({
      commentId: "c4",
      positivePreferenceStrength: "regular",
      seenInFeed: true,
    })).anchorIneligibilityReason).toBeNull();
  });

  it("aggregates participation, seeLess, and previous-digest history per thread", () => {
    const rows = makeLinearThreadRows("thread-1", 2);
    const annotationsByCommentId = new Map([
      ["thread-1-reply-1", makeAnnotation({
        commentId: "thread-1-reply-1",
        authoredByReader: true,
        hasActiveSeeLess: true,
      })],
    ]);
    const annotation = buildAiDigestThreadAnnotation({
      threadId: "thread-1",
      rows,
      annotationsByCommentId,
      participatedPerRanking: false,
      postHistoryById: new Map([
        ["thread-1", {
          previousDigestInclusionCount: 1,
          lastIncludedAt: "2026-07-10T12:00:00.000Z",
        }],
        ["thread-1-reply-2", {
          previousDigestInclusionCount: 1,
          lastIncludedAt: "2026-07-14T12:00:00.000Z",
        }],
      ]),
    });
    expect(annotation).toEqual({
      threadId: "thread-1",
      participated: true,
      hasActiveSeeLess: true,
      previousDigestInclusionCount: 2,
      lastIncludedAt: "2026-07-14T12:00:00.000Z",
    });
  });
});

describe("AI digest thread selection prompt", () => {
  const dossier = buildAiDigestReaderContext(
    { createdAt: new Date("2026-01-01T00:00:00.000Z") },
    {
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
    },
    NOW,
  ).dossier;

  function makePromptCandidates(): AiDigestThreadCandidates {
    const siteWideRows = makeLinearThreadRows("site-thread", 2);
    const readerRows = makeLinearThreadRows("reader-thread", 1);
    const annotations = [
      makeAnnotation({
        commentId: "reader-thread-reply-1",
        newSinceLastVisit: true,
        replyToReaderComment: true,
      }),
      makeAnnotation({ commentId: "site-thread-reply-1", seenInFeed: true }),
    ];
    const commentFlagsById = flagsFromAnnotations(annotations);
    const siteWideCard = buildAiDigestThreadCard({
      threadId: "site-thread",
      source: "siteWide",
      rows: siteWideRows,
    });
    const readerCard = buildAiDigestThreadCard({
      threadId: "reader-thread",
      source: "readerRelevant",
      rows: readerRows,
      commentFlagsById,
    });
    return makeCandidates({
      siteWideThreads: siteWideCard ? [siteWideCard] : [],
      readerThreads: readerCard ? [readerCard] : [],
      commentFlagsById,
      threadAnnotationsById: new Map([
        ["reader-thread", {
          threadId: "reader-thread",
          participated: true,
          previousDigestInclusionCount: 1,
          lastIncludedAt: "2026-07-10T12:00:00.000Z",
          hasActiveSeeLess: false,
        }],
      ]),
    });
  }

  it("splits a cacheable shared prefix from the personalized suffix", () => {
    const candidates = makePromptCandidates();
    const prompt = buildAiDigestThreadSelectionPrompt(dossier, candidates, null, NOW);
    expect(prompt.promptVersion).toBe(AI_DIGEST_THREAD_SELECTION_PROMPT_VERSION);
    expect(prompt.prompt).toBe(`${prompt.sharedPrefix}\n\n${prompt.personalizedSuffix}`);
    expect(prompt.sharedPrefix).toContain("<UNTRUSTED_THREAD_CORPUS>");
    expect(prompt.sharedPrefix).toContain("site-thread");
    expect(prompt.sharedPrefix).not.toContain("reader-thread");
    expect(prompt.personalizedSuffix).toContain("<UNTRUSTED_READER_PROFILE>");
    expect(prompt.personalizedSuffix).toContain("<UNTRUSTED_READER_THREADS>");
    expect(prompt.personalizedSuffix).toContain("<UNTRUSTED_THREAD_ANNOTATIONS>");
    expect(prompt.personalizedSuffix).toContain(
      '["reader-thread-reply-1",[["newSinceLastVisit"],["anchorIneligible","replyToReader"]]]',
    );
    expect(prompt.personalizedSuffix).toContain('["site-thread-reply-1",[["seenInFeed"]]]');
    expect(prompt.personalizedSuffix).toContain(
      '["reader-thread",[["participated"],["previousDigest",1,7]]]',
    );

    const otherDossier = buildAiDigestReaderContext(
      { createdAt: new Date("2025-01-01T00:00:00.000Z") },
      {
        totalReadCount: 500,
        recentReadCount30Days: 50,
        recentReadCount180Days: 200,
        topAuthors: [{ authorId: "author-1", authorName: "Ada", readCount: 9 }],
        topTopics: [],
        recentReads: [],
        recentPositiveVotes: [],
        recentAuthoredPosts: [],
        recentCommentedPosts: [],
        readAgeBuckets: {
          under7Days: 10,
          from7To30Days: 40,
          from31To180Days: 150,
          over180Days: 300,
        },
        seeLessFeedback: [],
        subscribedAuthors: [],
      },
      NOW,
    ).dossier;
    const otherPrompt = buildAiDigestThreadSelectionPrompt(
      otherDossier,
      makeCandidates({ siteWideThreads: candidates.siteWideThreads }),
      "Focus on decision theory threads.",
      NOW,
    );
    expect(otherPrompt.sharedPrefix).toBe(prompt.sharedPrefix);
    expect(otherPrompt.personalizedSuffix).not.toBe(prompt.personalizedSuffix);
    expect(otherPrompt.personalizedSuffix).toContain("<UNTRUSTED_READER_INSTRUCTIONS>");
    expect(otherPrompt.personalizedSuffix).toContain("Focus on decision theory threads.");
    expect(prompt.personalizedSuffix).not.toContain("<UNTRUSTED_READER_INSTRUCTIONS>");
  });
});

describe("AI digest thread selection clamping", () => {
  function makeClampCandidates(): AiDigestThreadCandidates {
    const threadOneRows = makeLinearThreadRows("thread-1", 4);
    const threadTwoRows = makeLinearThreadRows("thread-2", 4);
    const threadThreeRows = makeLinearThreadRows("thread-3", 4);
    const commentFlagsById = flagsFromAnnotations([
      makeAnnotation({ commentId: "thread-2-reply-1", replyToReaderComment: true }),
    ]);
    const cards = [
      ["thread-1", threadOneRows],
      ["thread-2", threadTwoRows],
      ["thread-3", threadThreeRows],
    ] as const;
    return makeCandidates({
      siteWideThreads: cards.flatMap(([threadId, rows]) => {
        const card = buildAiDigestThreadCard({ threadId, source: "siteWide", rows });
        return card ? [card] : [];
      }),
      commentFlagsById,
      threadAnnotationsById: new Map([
        ["thread-3", {
          threadId: "thread-3",
          participated: false,
          previousDigestInclusionCount: 0,
          lastIncludedAt: null,
          hasActiveSeeLess: true,
        }],
      ]),
    });
  }

  type ModelSelectedThread =
    AiDigestThreadSelectionModelOutput["selectedThreads"][number];

  function selection(overrides: Partial<ModelSelectedThread>): ModelSelectedThread {
    return {
      anchorCommentId: "thread-1",
      displayCommentIds: [],
      reason: "New replies in a thread you commented in",
      ...overrides,
    };
  }

  it("drops unknown anchors, ineligible anchors, and seeLess threads", () => {
    const candidates = makeClampCandidates();
    const clamped = clampAiDigestThreadSelectionOutput({
      selectedThreads: [
        selection({ anchorCommentId: "unknown-comment" }),
        selection({ anchorCommentId: "thread-2-reply-1" }),
        selection({ anchorCommentId: "thread-3" }),
        selection({ anchorCommentId: "thread-1" }),
      ],
    }, candidates);
    expect(clamped.selectedThreads).toEqual([
      {
        anchorCommentId: "thread-1",
        contextCommentIds: [],
        displayCommentIds: [],
        reason: "New replies in a thread you commented in",
      },
    ]);
  });

  it("keeps only display comments connected to the anchor and dedupes threads", () => {
    const candidates = makeClampCandidates();
    const clamped = clampAiDigestThreadSelectionOutput({
      selectedThreads: [
        selection({
          anchorCommentId: "thread-1-reply-1",
          // reply-3 connects only through reply-2; listing it before reply-2
          // must still work, while a cross-thread ID and the anchor itself drop.
          displayCommentIds: [
            "thread-1-reply-3",
            "thread-1-reply-2",
            "thread-2-reply-1",
            "thread-1-reply-1",
          ],
        }),
        selection({ anchorCommentId: "thread-1-reply-2" }),
      ],
    }, candidates);
    expect(clamped.selectedThreads).toEqual([{
      anchorCommentId: "thread-1-reply-1",
      contextCommentIds: [],
      displayCommentIds: ["thread-1-reply-2", "thread-1-reply-3"],
      reason: "New replies in a thread you commented in",
    }]);
  });

  it("keeps a connected prefix when reversed replies exceed the per-thread budget", () => {
    const clamped = clampAiDigestThreadSelectionOutput({
      selectedThreads: [selection({
        displayCommentIds: ["thread-1-reply-3", "thread-1-reply-2", "thread-1-reply-1"],
      })],
    }, makeClampCandidates());
    expect(clamped.selectedThreads[0].displayCommentIds).toEqual([
      "thread-1-reply-1", "thread-1-reply-2",
    ]);
  });

  it("keeps the parent when only one reply fits in the remaining total budget", () => {
    const candidates = makeClampCandidates();
    candidates.threadAnnotationsById.delete("thread-3");
    const clamped = clampAiDigestThreadSelectionOutput({
      selectedThreads: [
        selection({ displayCommentIds: ["thread-1-reply-1", "thread-1-reply-2"] }),
        selection({ anchorCommentId: "thread-2" }),
        selection({
          anchorCommentId: "thread-3",
          displayCommentIds: ["thread-3-reply-2", "thread-3-reply-1"],
        }),
      ],
    }, candidates);
    expect(clamped.selectedThreads[2].displayCommentIds).toEqual(["thread-3-reply-1"]);
  });

  it("drops display comments whose chain skips over an undisplayed parent", () => {
    const candidates = makeClampCandidates();
    const clamped = clampAiDigestThreadSelectionOutput({
      selectedThreads: [
        selection({
          anchorCommentId: "thread-1-reply-1",
          displayCommentIds: ["thread-1-reply-3"],
        }),
      ],
    }, candidates);
    expect(clamped.selectedThreads[0].displayCommentIds).toEqual([]);
  });

  it("derives an upvoted direct parent as a one-comment context chain", () => {
    const candidates = makeClampCandidates();
    candidates.commentFlagsById.set(
      "thread-1-reply-1",
      toThreadCommentReaderFlags(makeAnnotation({
        commentId: "thread-1-reply-1",
        positivePreferenceStrength: "regular",
      })),
    );
    const [thread] = clampAiDigestThreadSelectionOutput({
      selectedThreads: [selection({
        anchorCommentId: "thread-1-reply-2",
        contextCommentId: "thread-1-reply-1",
      })],
    }, candidates).selectedThreads;
    expect(thread.contextCommentIds).toEqual(["thread-1-reply-1"]);
  });

  it("derives an authored ancestor and its intermediary in top-down order", () => {
    const candidates = makeClampCandidates();
    candidates.commentFlagsById.set(
      "thread-1-reply-1",
      toThreadCommentReaderFlags(makeAnnotation({
        commentId: "thread-1-reply-1",
        authoredByReader: true,
      })),
    );
    const [thread] = clampAiDigestThreadSelectionOutput({
      selectedThreads: [selection({
        anchorCommentId: "thread-1-reply-3",
        contextCommentId: "thread-1-reply-1",
      })],
    }, candidates).selectedThreads;
    expect(thread.contextCommentIds).toEqual([
      "thread-1-reply-1",
      "thread-1-reply-2",
    ]);
  });

  it("drops context that is not an ancestor or has no reader engagement", () => {
    const candidates = makeClampCandidates();
    candidates.commentFlagsById.set(
      "thread-1-reply-4",
      toThreadCommentReaderFlags(makeAnnotation({
        commentId: "thread-1-reply-4",
        positivePreferenceStrength: "strong",
      })),
    );
    const notAncestor = clampAiDigestThreadSelectionOutput({
      selectedThreads: [selection({
        anchorCommentId: "thread-1-reply-2",
        contextCommentId: "thread-1-reply-4",
      })],
    }, candidates).selectedThreads[0];
    const notEngaged = clampAiDigestThreadSelectionOutput({
      selectedThreads: [selection({
        anchorCommentId: "thread-1-reply-2",
        contextCommentId: "thread-1-reply-1",
      })],
    }, candidates).selectedThreads[0];
    expect(notAncestor.contextCommentIds).toEqual([]);
    expect(notEngaged.contextCommentIds).toEqual([]);
  });

  it("drops context more than three hops above the anchor", () => {
    const candidates = makeClampCandidates();
    candidates.commentFlagsById.set(
      "thread-1",
      toThreadCommentReaderFlags(makeAnnotation({
        commentId: "thread-1",
        authoredByReader: true,
      })),
    );
    const [thread] = clampAiDigestThreadSelectionOutput({
      selectedThreads: [selection({
        anchorCommentId: "thread-1-reply-4",
        contextCommentId: "thread-1",
      })],
    }, candidates).selectedThreads;
    expect(thread.contextCommentIds).toEqual([]);
  });

  it("drops context IDs that collide with the anchor or requested display comments", () => {
    const candidates = makeClampCandidates();
    ["thread-1-reply-1", "thread-1-reply-2"].forEach((commentId) => {
      candidates.commentFlagsById.set(
        commentId,
        toThreadCommentReaderFlags(makeAnnotation({
          commentId,
          positivePreferenceStrength: "regular",
        })),
      );
    });
    const anchorCollision = clampAiDigestThreadSelectionOutput({
      selectedThreads: [selection({
        anchorCommentId: "thread-1-reply-2",
        contextCommentId: "thread-1-reply-2",
      })],
    }, candidates).selectedThreads[0];
    const displayCollision = clampAiDigestThreadSelectionOutput({
      selectedThreads: [selection({
        anchorCommentId: "thread-1-reply-2",
        contextCommentId: "thread-1-reply-1",
        displayCommentIds: ["thread-1-reply-1"],
      })],
    }, candidates).selectedThreads[0];
    expect(anchorCollision.contextCommentIds).toEqual([]);
    expect(displayCollision.contextCommentIds).toEqual([]);
  });

  it("does not count context comments against display budgets", () => {
    const candidates = makeClampCandidates();
    candidates.threadAnnotationsById.delete("thread-3");
    candidates.commentFlagsById.set(
      "thread-1",
      toThreadCommentReaderFlags(makeAnnotation({
        commentId: "thread-1",
        authoredByReader: true,
      })),
    );
    const clamped = clampAiDigestThreadSelectionOutput({
      selectedThreads: [
        selection({
          anchorCommentId: "thread-1-reply-3",
          contextCommentId: "thread-1",
          displayCommentIds: ["thread-1-reply-4"],
        }),
        selection({
          anchorCommentId: "thread-2",
          displayCommentIds: ["thread-2-reply-1", "thread-2-reply-2"],
        }),
        selection({ anchorCommentId: "thread-3" }),
      ],
    }, candidates);
    expect(clamped.selectedThreads).toHaveLength(3);
    expect(clamped.selectedThreads[0].contextCommentIds).toEqual([
      "thread-1",
      "thread-1-reply-1",
      "thread-1-reply-2",
    ]);
    expect(clamped.selectedThreads.reduce(
      (total, thread) => total + 1 + thread.displayCommentIds.length,
      0,
    )).toBe(AI_DIGEST_MAX_THREAD_COMMENTS_TOTAL);
  });

  it("enforces the total displayed-comment budget across threads", () => {
    const candidates = makeClampCandidates();
    const clamped = clampAiDigestThreadSelectionOutput({
      selectedThreads: [
        selection({
          anchorCommentId: "thread-1",
          displayCommentIds: ["thread-1-reply-1", "thread-1-reply-2"],
        }),
        selection({
          anchorCommentId: "thread-2",
          displayCommentIds: ["thread-2-reply-1", "thread-2-reply-2"],
        }),
        selection({ anchorCommentId: "thread-3-reply-1" }),
      ],
    }, candidates);
    const totalDisplayed = clamped.selectedThreads.reduce(
      (total, thread) => total + 1 + thread.displayCommentIds.length,
      0,
    );
    expect(totalDisplayed).toBeLessThanOrEqual(AI_DIGEST_MAX_THREAD_COMMENTS_TOTAL);
    expect(clamped.selectedThreads).toHaveLength(2);
  });

  function withThreadOneAnnotation(
    annotation: Partial<AiDigestThreadAnnotation>,
  ): AiDigestThreadCandidates {
    const candidates = makeClampCandidates();
    candidates.threadAnnotationsById.set("thread-1", {
      threadId: "thread-1",
      participated: false,
      hasActiveSeeLess: false,
      previousDigestInclusionCount: 1,
      lastIncludedAt: null,
      ...annotation,
    });
    return candidates;
  }

  function clampThreadOne(candidates: AiDigestThreadCandidates): AiDigestSelectedThread[] {
    return clampAiDigestThreadSelectionOutput({
      selectedThreads: [selection({ anchorCommentId: "thread-1" })],
    }, candidates).selectedThreads;
  }

  // The thread-1 card holds replies dated 2026-07-10 through 07-13 and a root
  // dated 2026-07-15, so a last inclusion on 07-16 means nothing has moved.
  it("drops a repeated thread whose card has no comments since it last ran", () => {
    expect(clampThreadOne(withThreadOneAnnotation({
      lastIncludedAt: "2026-07-16T00:00:00.000Z",
    }))).toEqual([]);
  });

  it("keeps a repeated thread once a newer comment lands in the card", () => {
    expect(clampThreadOne(withThreadOneAnnotation({
      lastIncludedAt: "2026-07-14T00:00:00.000Z",
    }))).toHaveLength(1);
  });

  it("keeps threads with no recorded inclusion date or no prior inclusion", () => {
    expect(clampThreadOne(withThreadOneAnnotation({ lastIncludedAt: null }))).toHaveLength(1);
    expect(clampThreadOne(withThreadOneAnnotation({
      previousDigestInclusionCount: 0,
      lastIncludedAt: "2026-07-16T00:00:00.000Z",
    }))).toHaveLength(1);
    expect(clampThreadOne(makeClampCandidates())).toHaveLength(1);
  });

  it("decodes stray escapes in reasons and nulls empty or overlong ones", () => {
    const candidates = makeClampCandidates();
    const clamped = clampAiDigestThreadSelectionOutput({
      selectedThreads: [
        selection({
          anchorCommentId: "thread-1",
          reason: "New replies \\u2014 in a thread you commented in",
        }),
        selection({
          anchorCommentId: "thread-2",
          reason: "x".repeat(AI_DIGEST_THREAD_REASON_MAX_LENGTH + 1),
        }),
      ],
    }, candidates);
    expect(clamped.selectedThreads[0].reason).toBe(
      "New replies — in a thread you commented in",
    );
    expect(clamped.selectedThreads[1].reason).toBeNull();
  });
});

describe("AI digest thread merge into the spec", () => {
  const postCandidates: AiDigestPostCandidateCard[] = [1, 2, 3, 4, 5].map((index) => ({
    postId: `post-${index}`,
    revisionId: `revision-${index}`,
    title: `Candidate ${index}`,
    author: `Author ${index}`,
    publicationDate: `2026-07-${String(index).padStart(2, "0")}T12:00:00.000Z`,
    baseScore: 20 + index,
    score: 1.5 + index,
    tags: [`Topic ${index}`],
    isCurated: false,
    isSubscribedToAuthor: false,
    isRead: false,
    upvoteStrength: null,
    previousDigestInclusionCount: 0,
    lastIncludedAt: null,
    exclusionReason: null,
    summary: `Summary for candidate ${index}. Long enough to be a valid reusable summary.`,
    summaryProvenance: {
      revisionId: `revision-${index}`,
      modelId: "summary-model",
      promptVersion: "summary-v1",
    },
  }));

  const quickTake: AiDigestQuickTakeCandidate = {
    commentId: "quick-take-1",
    author: "Quick author",
    authorId: "quick-author-1",
    publicationDate: "2026-07-10T12:00:00.000Z",
    baseScore: 30,
    body: "A quick take body long enough to read in the corpus.",
    upvoteStrength: null,
    isSubscribedToAuthor: false,
    previousDigestInclusionCount: 0,
    lastIncludedAt: null,
    exclusionReason: null,
  };

  function makeOutput(fifthItemId = "post-5"): AiDigestPostSelectionModelOutput {
    return {
      selectedItems: [
        { itemId: "post-1", reason: "Grounded reason 1" },
        { itemId: "post-2", reason: "Grounded reason 2" },
        { itemId: "post-3", reason: "Grounded reason 3" },
        { itemId: "post-4", reason: "Grounded reason 4" },
        { itemId: fifthItemId, reason: "Grounded reason 5" },
      ],
      subject: "Candidate 1 — plus four more",
      preheader: "Also Candidate 2 and Candidate 3",
      aiNote: ["Your recent reading suggests a current interest in this topic."],
    };
  }

  const selectedThreads: AiDigestSelectedThread[] = [
    {
      anchorCommentId: "anchor-1",
      contextCommentIds: ["reader-comment-1", "intermediate-comment-1"],
      displayCommentIds: ["reply-1", "reply-2"],
      reason: "New replies in a thread you commented in",
    },
    {
      anchorCommentId: "quick-take-1",
      contextCommentIds: [],
      displayCommentIds: [],
      reason: null,
    },
    {
      anchorCommentId: "anchor-2",
      contextCommentIds: ["context-quick-take"],
      displayCommentIds: ["quick-take-1"],
      reason: null,
    },
    {
      anchorCommentId: "anchor-3",
      contextCommentIds: ["quick-take-1"],
      displayCommentIds: [],
      reason: null,
    },
  ];

  it("drops duplicate threads but only strips an overlapping context chain", () => {
    const selectedItems = buildAiDigestSpecFromPostSelection({
      recipientName: "Developer",
      modelLabel: "Test Model",
      personalInstructions: null,
      output: validateAiDigestPostSelectionOutput(makeOutput("quick-take-1"), postCandidates, [quickTake]),
    }).sections[0].items;
    expect(buildAiDigestDiscussionItems(selectedThreads, selectedItems)).toEqual([
      {
        documentRef: { documentType: "comment", documentId: "anchor-1" },
        placement: "full",
        reason: "New replies in a thread you commented in",
        contextComments: [
          { commentId: "reader-comment-1" },
          { commentId: "intermediate-comment-1" },
        ],
        threadComments: [{ commentId: "reply-1" }, { commentId: "reply-2" }],
      },
      {
        documentRef: { documentType: "comment", documentId: "anchor-3" },
        placement: "full",
        threadComments: [],
      },
    ]);
  });

  it("builds a discussion section from thread output and omits it when empty", () => {
    const withThreads = buildAiDigestSpecFromPostSelection({
      recipientName: "Developer",
      modelLabel: "Test Model",
      personalInstructions: null,
      output: validateAiDigestPostSelectionOutput(makeOutput(), postCandidates),
      selectedThreads,
    });
    const discussion = withThreads.sections.find((section) => section.kind === "discussion");
    expect(discussion?.title).toBe("From the discussion");
    expect(discussion?.items.map((item) => item.documentRef.documentId)).toEqual([
      "anchor-1",
      "quick-take-1",
      "anchor-2",
      "anchor-3",
    ]);

    const withoutThreads = buildAiDigestSpecFromPostSelection({
      recipientName: "Developer",
      modelLabel: "Test Model",
      personalInstructions: null,
      output: validateAiDigestPostSelectionOutput(makeOutput(), postCandidates),
      selectedThreads: [],
    });
    expect(withoutThreads.sections.some((section) => section.kind === "discussion")).toBe(false);
  });

  it("counts discussion anchors toward repeat-avoidance history", () => {
    const history = buildAiDigestHistory([{
      _id: "issue-1",
      recipientId: "reader-1",
      postIds: ["post-1"],
      quickTakeIds: [],
      discussionCommentIds: ["anchor-1"],
      generatedAt: new Date("2026-07-10T12:00:00.000Z"),
      countsTowardHistory: true,
      selectionModelId: "selection-model",
      promptVersion: "selection-v2",
    }], []);
    expect(history.postHistoryById.get("anchor-1")).toEqual({
      previousDigestInclusionCount: 1,
      lastIncludedAt: "2026-07-10T12:00:00.000Z",
    });
  });
});
