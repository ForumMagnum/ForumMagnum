import { postStatuses } from "@/lib/collections/posts/constants";
import { aboutPostIdSetting } from "@/lib/instanceSettings";
import type {
  AiDigestCandidateAnnotationRow,
  AiDigestCanonicalPostCandidateRow,
  AiDigestCuratedPostRow,
  AiDigestPostCandidateByIdRow,
  AiDigestPostReferenceRow,
  AiDigestPositiveVoteRow,
  AiDigestReaderDataRow,
  AiDigestSeeLessRow,
  AiDigestSubscribedAuthorRow,
} from "@/server/repos/PostsRepo";
import type {
  AiDigestQuickTakeAnnotationRow,
  AiDigestQuickTakeCandidateRow,
} from "@/server/repos/CommentsRepo";
import { htmlToTextDefault } from "@/lib/htmlToText";
import type { AiDigestPostHistory } from "./aiDigestHistory";

export type AiDigestCandidateRetrievalSource =
  | "newsletterRecentPostsSql"
  | "selectionToolSearch";

export const AI_DIGEST_PROTOTYPE_MAX_AGE_DAYS = 14;
// Production should expand this to four weeks once the prototype is operationally validated.
export const AI_DIGEST_PRODUCTION_MAX_AGE_DAYS = 28;
export const AI_DIGEST_DEFAULT_CANDIDATE_MAX_AGE_DAYS = AI_DIGEST_PROTOTYPE_MAX_AGE_DAYS;
export const AI_DIGEST_DEFAULT_MIN_KARMA = 20;
export const AI_DIGEST_DEFAULT_CANDIDATE_LIMIT = 60;
export const AI_DIGEST_DEFAULT_QUICK_TAKE_MIN_KARMA = 20;
export const AI_DIGEST_DEFAULT_QUICK_TAKE_LIMIT = 30;
export const AI_DIGEST_QUICK_TAKE_BODY_MAX_CHARS = 800;
export const AI_DIGEST_CURATED_LOOKBACK_COUNT = 10;
export const AI_DIGEST_READER_ACTIVITY_WINDOW_DAYS = 180;
export const AI_DIGEST_READER_LIST_LIMIT = 20;
export const AI_DIGEST_AFFINITY_LIMIT = 15;

const DAY_MS = 24 * 60 * 60 * 1000;
const READ_SHARE_SIGNIFICANT_DIGITS = 3;

export interface AiDigestReadShareCalibration {
  oneReadPercent: number | null;
  tenReadsPercent: number | null;
}

export interface AiDigestReaderPostInteraction {
  postId: string;
  title: string;
  author: string;
  publicationDate: string;
  lastEngagedAt: string;
  readAt?: string;
  likeStrength?: "regular" | "strong";
  likedAt?: string;
  authoredAt?: string;
  commentedAt?: string;
}

export type AiDigestNegativePreferenceReason =
  | "author"
  | "topic"
  | "contentType"
  | "other";

export interface AiDigestNegativePreference {
  collectionName: AiDigestSeeLessRow["collectionName"];
  documentId: string;
  feedbackAt: string;
  reasons: AiDigestNegativePreferenceReason[];
  postId?: string;
  title?: string;
  author?: string;
  topics?: string[];
  feedbackText?: string;
}

export interface AiDigestUserDossier {
  activity: {
    accountAgeDays: number;
    totalReadCount: number;
    recentReadCount30Days: number;
    recentReadCount180Days: number;
    readShareCalibration: AiDigestReadShareCalibration;
  };
  affinities: {
    windowDays: number;
    authors: Array<{
      author: string;
      readCount: number;
    }>;
    topics: Array<{
      topic: string;
      readCount: number;
    }>;
  };
  recentInteractions: {
    windowDays: number;
    posts: AiDigestReaderPostInteraction[];
  };
  readAgeBuckets: AiDigestReaderDataRow["readAgeBuckets"] & {
    windowDays: number;
  };
  followedAuthors: string[];
  negativePreferences: {
    windowDays: number;
    items: AiDigestNegativePreference[];
  };
}

export interface AiDigestReaderContext {
  dossier: AiDigestUserDossier;
  evidenceCount: number;
}

export interface AiDigestPostEligibilityInput {
  postId: string;
  status: number;
  draft: boolean;
  deletedDraft: boolean;
  rejected: boolean;
  isFuture: boolean;
  unlisted: boolean;
  authorIsUnreviewed: boolean;
  onlyVisibleToLoggedIn: boolean;
  onlyVisibleToEstablishedAccounts: boolean;
  disableRecommendation: boolean;
  shortform: boolean;
  isEvent: boolean;
  hiddenRelatedQuestion: boolean;
  groupId: string | null;
  postCategory: DbPost["postCategory"];
  question: boolean;
  debate: boolean;
  meta: boolean;
  podcastEpisodeId: string | null;
  hideAuthor: boolean;
  frontpageDate: Date | null;
  noIndex: boolean;
  sticky: boolean;
  defaultRecommendation: boolean;
  postedAt: Date | null;
  baseScore: number;
  contentsLatest: string | null;
  userId: string | null;
  coauthorUserIds: string[];
  isRead: boolean;
  isHidden: boolean;
  hasActiveSeeLess: boolean;
}

export type AiDigestPostIneligibilityReason =
  | "notApproved"
  | "draft"
  | "future"
  | "unlisted"
  | "unreviewedAuthor"
  | "establishedAccountsOnly"
  | "recommendationsDisabled"
  | "aboutPost"
  | "shortformContainer"
  | "event"
  | "hiddenRelatedQuestion"
  | "invalidPublicationDate"
  | "tooOld"
  | "belowKarmaFloor"
  | "missingContentsRevision"
  | "recipientAuthored"
  | "hiddenByRecipient"
  | "activeSeeLess";

export interface AiDigestPostEligibilityOptions {
  recipientId: string;
  aboutPostId: string;
  minPostedAt: Date;
  minKarma: number;
  now: Date;
}

export interface AiDigestPostSummaryProvenance {
  revisionId: string;
  modelId: string;
  promptVersion: string;
}

export type AiDigestCandidateExclusionReason =
  | "recipientAuthored"
  | "hiddenByRecipient"
  | "activeSeeLess"
  | "previouslyIncluded";

export interface AiDigestPostCandidate {
  postId: string;
  revisionId: string;
  title: string;
  author: string;
  authorIds: string[];
  publicationDate: string;
  baseScore: number;
  score: number;
  tags: string[];
  isCurated: boolean;
  isSubscribedToAuthor: boolean;
  isRead: boolean;
  upvoteStrength: "regular" | "strong" | null;
  previousDigestInclusionCount: number;
  lastIncludedAt: string | null;
  exclusionReason: AiDigestCandidateExclusionReason | null;
  retrievalProvenance: {
    source: AiDigestCandidateRetrievalSource;
    maxAgeDays: number | null;
    minKarma: number;
  };
}

export interface AiDigestPostCandidateCard extends AiDigestPostCandidate {
  summary: string;
  summaryProvenance: AiDigestPostSummaryProvenance;
}

export interface AiDigestSelectedPostCandidate extends AiDigestPostCandidate {
  summary?: string;
  summaryProvenance?: AiDigestPostSummaryProvenance;
}

export interface AiDigestQuickTakeCandidate {
  commentId: string;
  author: string;
  authorId: string | null;
  publicationDate: string;
  baseScore: number;
  body: string;
  upvoteStrength: "regular" | "strong" | null;
  isSubscribedToAuthor: boolean;
  previousDigestInclusionCount: number;
  lastIncludedAt: string | null;
  exclusionReason: AiDigestCandidateExclusionReason | null;
}

export interface LoadAiDigestPostCandidatesOptions {
  maxAgeDays?: number;
  minKarma?: number;
  limit?: number;
  quickTakeMinKarma?: number;
  quickTakeLimit?: number;
  now?: Date;
  postHistoryById?: Map<string, AiDigestPostHistory>;
}

function percentageOfReads(readCount: number, totalReadCount: number): number | null {
  if (totalReadCount === 0) {
    return null;
  }
  const percentage = (readCount / totalReadCount) * 100;
  return Number(percentage.toPrecision(READ_SHARE_SIGNIFICANT_DIGITS));
}

export function buildReadShareCalibration(totalReadCount: number): AiDigestReadShareCalibration {
  return {
    oneReadPercent: percentageOfReads(1, totalReadCount),
    tenReadsPercent: percentageOfReads(10, totalReadCount),
  };
}

export function deduplicateAuthorSubscriptions(
  subscriptions: AiDigestSubscribedAuthorRow[],
): AiDigestSubscribedAuthorRow[] {
  return Array.from(
    new Map(subscriptions.map((subscription) => [subscription.authorId, subscription])).values(),
  ).sort((first, second) =>
    first.authorName.localeCompare(second.authorName) || first.authorId.localeCompare(second.authorId),
  );
}

function dateOnly(timestamp: string): string {
  return timestamp.slice(0, 10);
}

function postInteractionBase(
  reference: AiDigestPostReferenceRow,
): Pick<
  AiDigestReaderPostInteraction,
  "postId" | "title" | "author" | "publicationDate" | "lastEngagedAt"
> {
  return {
    postId: reference.postId,
    title: reference.title,
    author: reference.authorName,
    publicationDate: dateOnly(reference.postedAt),
    lastEngagedAt: dateOnly(reference.occurredAt),
  };
}

function recentReadInteraction(
  reference: AiDigestPostReferenceRow,
): AiDigestReaderPostInteraction {
  return {
    ...postInteractionBase(reference),
    readAt: dateOnly(reference.occurredAt),
  };
}

function positiveVoteInteraction(
  reference: AiDigestPositiveVoteRow,
): AiDigestReaderPostInteraction {
  return {
    ...postInteractionBase(reference),
    likeStrength: reference.voteStrength,
    likedAt: dateOnly(reference.occurredAt),
  };
}

function authoredPostInteraction(
  reference: AiDigestPostReferenceRow,
): AiDigestReaderPostInteraction {
  return {
    ...postInteractionBase(reference),
    authoredAt: dateOnly(reference.occurredAt),
  };
}

function commentedPostInteraction(
  reference: AiDigestPostReferenceRow,
): AiDigestReaderPostInteraction {
  return {
    ...postInteractionBase(reference),
    commentedAt: dateOnly(reference.occurredAt),
  };
}

function mergePostInteractions(
  interactions: AiDigestReaderPostInteraction[],
): AiDigestReaderPostInteraction[] {
  const interactionsByPostId = interactions.reduce((result, interaction) => {
    const previous = result.get(interaction.postId);
    result.set(interaction.postId, previous
      ? {
        ...previous,
        ...interaction,
        lastEngagedAt: previous.lastEngagedAt > interaction.lastEngagedAt
          ? previous.lastEngagedAt
          : interaction.lastEngagedAt,
      }
      : interaction);
    return result;
  }, new Map<string, AiDigestReaderPostInteraction>());
  return Array.from(interactionsByPostId.values()).sort((first, second) =>
    second.lastEngagedAt.localeCompare(first.lastEngagedAt)
    || first.postId.localeCompare(second.postId),
  );
}

function buildRecentInteractions(row: AiDigestReaderDataRow): AiDigestReaderPostInteraction[] {
  return mergePostInteractions([
    ...row.recentReads.map(recentReadInteraction),
    ...row.recentPositiveVotes.map(positiveVoteInteraction),
    ...row.recentAuthoredPosts.map(authoredPostInteraction),
    ...row.recentCommentedPosts.map(commentedPostInteraction),
  ]);
}

function includedNegativePreferenceReason(
  included: boolean | undefined,
  reason: AiDigestNegativePreferenceReason,
): AiDigestNegativePreferenceReason[] {
  return included ? [reason] : [];
}

function negativePreferenceReasons(
  feedback: AiDigestSeeLessRow,
): AiDigestNegativePreferenceReason[] {
  return [
    ...includedNegativePreferenceReason(feedback.feedbackReasons?.author, "author"),
    ...includedNegativePreferenceReason(feedback.feedbackReasons?.topic, "topic"),
    ...includedNegativePreferenceReason(feedback.feedbackReasons?.contentType, "contentType"),
    ...includedNegativePreferenceReason(feedback.feedbackReasons?.other, "other"),
  ];
}

function buildNegativePreference(
  feedback: AiDigestSeeLessRow,
): AiDigestNegativePreference {
  const feedbackText = feedback.feedbackReasons?.text?.trim();
  return {
    collectionName: feedback.collectionName,
    documentId: feedback.documentId,
    feedbackAt: dateOnly(feedback.createdAt),
    reasons: negativePreferenceReasons(feedback),
    ...(feedback.targetPostId ? { postId: feedback.targetPostId } : {}),
    ...(feedback.targetTitle ? { title: feedback.targetTitle } : {}),
    ...(feedback.targetAuthor ? { author: feedback.targetAuthor } : {}),
    ...(feedback.targetTagNames.length > 0 ? { topics: feedback.targetTagNames } : {}),
    ...(feedbackText ? { feedbackText } : {}),
  };
}

function countDossierEvidence(dossier: AiDigestUserDossier): number {
  return 2
    + dossier.affinities.authors.length
    + dossier.affinities.topics.length
    + dossier.recentInteractions.posts.length
    + dossier.followedAuthors.length
    + dossier.negativePreferences.items.length;
}

export function buildAiDigestReaderContext(
  user: Pick<DbUser, "createdAt">,
  row: AiDigestReaderDataRow,
  now = new Date(),
): AiDigestReaderContext {
  const subscriptions = deduplicateAuthorSubscriptions(row.subscribedAuthors);
  const dossier: AiDigestUserDossier = {
    activity: {
      accountAgeDays: Math.max(0, Math.floor((now.getTime() - user.createdAt.getTime()) / DAY_MS)),
      totalReadCount: row.totalReadCount,
      recentReadCount30Days: row.recentReadCount30Days,
      recentReadCount180Days: row.recentReadCount180Days,
      readShareCalibration: buildReadShareCalibration(row.totalReadCount),
    },
    affinities: {
      windowDays: AI_DIGEST_READER_ACTIVITY_WINDOW_DAYS,
      authors: row.topAuthors.map((author) => ({
        author: author.authorName,
        readCount: author.readCount,
      })),
      topics: row.topTopics.map((topic) => ({
        topic: topic.tagName,
        readCount: topic.readCount,
      })),
    },
    recentInteractions: {
      windowDays: AI_DIGEST_READER_ACTIVITY_WINDOW_DAYS,
      posts: buildRecentInteractions(row),
    },
    readAgeBuckets: {
      windowDays: AI_DIGEST_READER_ACTIVITY_WINDOW_DAYS,
      ...row.readAgeBuckets,
    },
    followedAuthors: subscriptions.map((subscription) => subscription.authorName),
    negativePreferences: {
      windowDays: AI_DIGEST_READER_ACTIVITY_WINDOW_DAYS,
      items: row.seeLessFeedback.map(buildNegativePreference),
    },
  };
  return {
    dossier,
    evidenceCount: countDossierEvidence(dossier),
  };
}

export function getAiDigestPostIneligibilityReason(
  post: AiDigestPostEligibilityInput,
  options: AiDigestPostEligibilityOptions,
): AiDigestPostIneligibilityReason | null {
  if (post.status !== postStatuses.STATUS_APPROVED) return "notApproved";
  if (post.draft) return "draft";
  if (post.isFuture) return "future";
  if (post.unlisted) return "unlisted";
  if (post.authorIsUnreviewed) return "unreviewedAuthor";
  if (post.onlyVisibleToEstablishedAccounts) return "establishedAccountsOnly";
  if (post.disableRecommendation) return "recommendationsDisabled";
  if (post.postId === options.aboutPostId) return "aboutPost";
  if (post.shortform) return "shortformContainer";
  if (post.isEvent) return "event";
  if (post.hiddenRelatedQuestion) return "hiddenRelatedQuestion";
  if (!post.postedAt || post.postedAt > options.now) return "invalidPublicationDate";
  if (post.postedAt < options.minPostedAt) return "tooOld";
  if (post.baseScore < options.minKarma) return "belowKarmaFloor";
  if (!post.contentsLatest) return "missingContentsRevision";
  if (
    post.userId === options.recipientId
    || post.coauthorUserIds.includes(options.recipientId)
  ) {
    return "recipientAuthored";
  }
  if (post.isHidden) return "hiddenByRecipient";
  if (post.hasActiveSeeLess) return "activeSeeLess";
  return null;
}

export function aiDigestCandidateExclusionReason(
  annotation: AiDigestCandidateAnnotationRow | undefined,
  hiddenByRecipient: boolean,
  documentHistory: AiDigestPostHistory | undefined,
): AiDigestCandidateExclusionReason | null {
  if (annotation?.recipientAuthored) {
    return "recipientAuthored";
  }
  if (hiddenByRecipient) {
    return "hiddenByRecipient";
  }
  if (annotation?.hasActiveSeeLess) {
    return "activeSeeLess";
  }
  if (documentHistory && documentHistory.previousDigestInclusionCount > 0) {
    return "previouslyIncluded";
  }
  return null;
}

function toAiDigestPostCandidate(
  row: AiDigestCanonicalPostCandidateRow,
  annotation: AiDigestCandidateAnnotationRow | undefined,
  hiddenByRecipient: boolean,
  maxAgeDays: number | null,
  minKarma: number,
  postHistory: AiDigestPostHistory | undefined,
  retrievalSource: AiDigestCandidateRetrievalSource = "newsletterRecentPostsSql",
): AiDigestPostCandidate {
  return {
    postId: row.postId,
    revisionId: row.revisionId,
    title: row.title,
    author: row.author,
    authorIds: row.authorIds,
    publicationDate: row.publicationDate.toISOString(),
    baseScore: row.baseScore,
    score: row.score,
    tags: row.tagNames,
    isCurated: row.isCurated,
    isSubscribedToAuthor: annotation?.isSubscribedToAuthor ?? false,
    isRead: annotation?.isRead ?? false,
    upvoteStrength: annotation?.positivePreferenceStrength ?? null,
    previousDigestInclusionCount: postHistory?.previousDigestInclusionCount ?? 0,
    lastIncludedAt: postHistory?.lastIncludedAt ?? null,
    exclusionReason: aiDigestCandidateExclusionReason(annotation, hiddenByRecipient, postHistory),
    retrievalProvenance: {
      source: retrievalSource,
      maxAgeDays,
      minKarma,
    },
  };
}

export function aiDigestEligibilityInputFromByIdRow(
  row: AiDigestPostCandidateByIdRow,
  annotation: AiDigestCandidateAnnotationRow | undefined,
  hiddenByRecipient: boolean,
): AiDigestPostEligibilityInput {
  return {
    postId: row.postId,
    status: row.status,
    draft: row.draft,
    deletedDraft: row.deletedDraft,
    rejected: row.rejected,
    isFuture: row.isFuture,
    unlisted: row.unlisted,
    authorIsUnreviewed: row.authorIsUnreviewed,
    onlyVisibleToLoggedIn: row.onlyVisibleToLoggedIn,
    onlyVisibleToEstablishedAccounts: row.onlyVisibleToEstablishedAccounts,
    disableRecommendation: row.disableRecommendation,
    shortform: row.shortform,
    isEvent: row.isEvent,
    hiddenRelatedQuestion: row.hiddenRelatedQuestion,
    groupId: row.groupId,
    postCategory: row.postCategory,
    question: row.question,
    debate: row.debate,
    meta: row.meta,
    podcastEpisodeId: row.podcastEpisodeId,
    hideAuthor: row.hideAuthor,
    frontpageDate: row.frontpageDate,
    noIndex: row.noIndex,
    sticky: row.sticky,
    defaultRecommendation: row.defaultRecommendation,
    postedAt: row.publicationDate,
    baseScore: row.baseScore,
    contentsLatest: row.revisionId,
    userId: row.userId,
    coauthorUserIds: row.coauthorUserIds,
    isRead: annotation?.isRead ?? false,
    isHidden: hiddenByRecipient,
    hasActiveSeeLess: annotation?.hasActiveSeeLess ?? false,
  };
}

export function toAiDigestToolSearchCandidate(
  row: AiDigestPostCandidateByIdRow,
  annotation: AiDigestCandidateAnnotationRow | undefined,
  hiddenByRecipient: boolean,
  minKarma: number,
  postHistory: AiDigestPostHistory | undefined,
): AiDigestPostCandidate {
  if (!row.revisionId || !row.publicationDate) {
    throw new Error(`Cannot build tool-search candidate without revision and publication date for ${row.postId}`);
  }
  return toAiDigestPostCandidate(
    {
      ...row,
      revisionId: row.revisionId,
      publicationDate: row.publicationDate,
    },
    annotation,
    hiddenByRecipient,
    null,
    minKarma,
    postHistory,
    "selectionToolSearch",
  );
}

export function isSelectableAiDigestCandidate(
  candidate: { exclusionReason: AiDigestCandidateExclusionReason | null },
): boolean {
  return !candidate.exclusionReason;
}

/**
 * Thin-pool fallback: drop the repeat-suppression exclusion so previously
 * recommended items become selectable again. The `previousDigestInclusionCount`
 * and `lastIncludedAt` annotations survive, so the prompt's soft repeat
 * avoidance still steers toward the least-recently-repeated items.
 */
export function relaxPreviousInclusionExclusions<
  T extends { exclusionReason: AiDigestCandidateExclusionReason | null },
>(candidates: T[]): T[] {
  return candidates.map((candidate) =>
    candidate.exclusionReason === "previouslyIncluded"
      ? { ...candidate, exclusionReason: null }
      : candidate);
}

export function aiDigestQuickTakeExclusionReason(
  annotation: AiDigestQuickTakeAnnotationRow | undefined,
  documentHistory: AiDigestPostHistory | undefined,
): AiDigestCandidateExclusionReason | null {
  if (annotation?.recipientAuthored) {
    return "recipientAuthored";
  }
  if (annotation?.hasActiveSeeLess) {
    return "activeSeeLess";
  }
  if (documentHistory && documentHistory.previousDigestInclusionCount > 0) {
    return "previouslyIncluded";
  }
  return null;
}

function boundedQuickTakeBody(revisionHtml: string): string {
  return htmlToTextDefault(revisionHtml)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, AI_DIGEST_QUICK_TAKE_BODY_MAX_CHARS);
}

function toAiDigestQuickTakeCandidate(
  row: AiDigestQuickTakeCandidateRow,
  annotation: AiDigestQuickTakeAnnotationRow | undefined,
  documentHistory: AiDigestPostHistory | undefined,
): AiDigestQuickTakeCandidate {
  return {
    commentId: row.commentId,
    author: row.author,
    authorId: row.authorId,
    publicationDate: row.publicationDate.toISOString(),
    baseScore: row.baseScore,
    body: boundedQuickTakeBody(row.revisionHtml),
    upvoteStrength: annotation?.positivePreferenceStrength ?? null,
    isSubscribedToAuthor: annotation?.isSubscribedToAuthor ?? false,
    previousDigestInclusionCount: documentHistory?.previousDigestInclusionCount ?? 0,
    lastIncludedAt: documentHistory?.lastIncludedAt ?? null,
    exclusionReason: aiDigestQuickTakeExclusionReason(annotation, documentHistory),
  };
}

export async function loadAiDigestReaderContext(
  user: DbUser,
  context: ResolverContext,
  now = new Date(),
): Promise<AiDigestReaderContext> {
  const row = await context.repos.posts.getAiDigestReaderData({
    userId: user._id,
    recentActivitySince: new Date(
      now.getTime() - (AI_DIGEST_READER_ACTIVITY_WINDOW_DAYS * DAY_MS),
    ),
    thirtyDaysAgo: new Date(now.getTime() - (30 * DAY_MS)),
    oneHundredEightyDaysAgo: new Date(now.getTime() - (180 * DAY_MS)),
    listLimit: AI_DIGEST_READER_LIST_LIMIT,
    affinityLimit: AI_DIGEST_AFFINITY_LIMIT,
  });
  return buildAiDigestReaderContext(user, row, now);
}

export async function loadAiDigestPostCandidates(
  user: DbUser,
  context: ResolverContext,
  options: LoadAiDigestPostCandidatesOptions = {},
): Promise<AiDigestPostCandidate[]> {
  const now = options.now ?? new Date();
  const maxAgeDays = options.maxAgeDays ?? AI_DIGEST_DEFAULT_CANDIDATE_MAX_AGE_DAYS;
  const minKarma = options.minKarma ?? AI_DIGEST_DEFAULT_MIN_KARMA;
  const limit = options.limit ?? AI_DIGEST_DEFAULT_CANDIDATE_LIMIT;
  const postHistoryById = options.postHistoryById ?? new Map<string, AiDigestPostHistory>();
  const aboutPostId = aboutPostIdSetting.get();
  const hiddenPostIds = new Set(
    user.hiddenPostsMetadata.map((metadata) => metadata.postId),
  );
  const minPostedAt = new Date(now.getTime() - (maxAgeDays * DAY_MS));
  const rows = await context.repos.posts.getAiDigestCanonicalPostCandidateRows({
    aboutPostId,
    minPostedAt,
    minKarma,
    limit,
  });
  const annotations = await context.repos.posts.getAiDigestCandidateAnnotationRows({
    userId: user._id,
    postIds: rows.map((row) => row.postId),
  });
  const annotationsByPostId = new Map(
    annotations.map((annotation) => [annotation.postId, annotation]),
  );
  return rows.map((row) =>
    toAiDigestPostCandidate(
      row,
      annotationsByPostId.get(row.postId),
      hiddenPostIds.has(row.postId),
      maxAgeDays,
      minKarma,
      postHistoryById.get(row.postId),
    ),
  );
}

/**
 * The most recently curated posts (up to the curated-module lookback count),
 * newest curation first, each flagged with whether the recipient has already
 * read it.
 */
export async function loadAiDigestRecentlyCuratedPosts(
  user: DbUser,
  context: ResolverContext,
  now = new Date(),
): Promise<AiDigestCuratedPostRow[]> {
  return context.repos.posts.getAiDigestRecentlyCuratedPostRows({
    userId: user._id,
    limit: AI_DIGEST_CURATED_LOOKBACK_COUNT,
    now,
  });
}

export async function loadAiDigestQuickTakeCandidates(
  user: DbUser,
  context: ResolverContext,
  options: LoadAiDigestPostCandidatesOptions = {},
): Promise<AiDigestQuickTakeCandidate[]> {
  const now = options.now ?? new Date();
  const maxAgeDays = options.maxAgeDays ?? AI_DIGEST_DEFAULT_CANDIDATE_MAX_AGE_DAYS;
  const minKarma = options.quickTakeMinKarma ?? AI_DIGEST_DEFAULT_QUICK_TAKE_MIN_KARMA;
  const limit = options.quickTakeLimit ?? AI_DIGEST_DEFAULT_QUICK_TAKE_LIMIT;
  const postHistoryById = options.postHistoryById ?? new Map<string, AiDigestPostHistory>();
  const minPostedAt = new Date(now.getTime() - (maxAgeDays * DAY_MS));
  const rows = await context.repos.comments.getAiDigestQuickTakeCandidateRows({
    minPostedAt,
    minKarma,
    limit,
  });
  const annotations = await context.repos.comments.getAiDigestQuickTakeAnnotationRows({
    userId: user._id,
    commentIds: rows.map((row) => row.commentId),
  });
  const annotationsByCommentId = new Map(
    annotations.map((annotation) => [annotation.commentId, annotation]),
  );
  return rows
    .map((row) =>
      toAiDigestQuickTakeCandidate(
        row,
        annotationsByCommentId.get(row.commentId),
        postHistoryById.get(row.commentId),
      ),
    )
    .filter((candidate) => candidate.body.length > 0);
}

export function buildAiDigestPostCandidateCards(
  candidates: Array<AiDigestPostCandidate & {
    summary: string;
    summaryProvenance: AiDigestPostSummaryProvenance;
  }>,
): AiDigestPostCandidateCard[] {
  return candidates;
}
