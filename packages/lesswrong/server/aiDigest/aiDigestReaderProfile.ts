import { DAY_MS } from "@/lib/aiDigest/constants";
import { daysAgo } from "@/lib/aiDigest/helpers";
import type {
  AiDigestReaderAffinityRow,
  AiDigestReaderNegativePreferenceRow,
  AiDigestReaderRecentPostRow,
  AiDigestReaderReadStats,
} from "@/server/repos/PostsRepo";

/** The window, in days, over which affinities and recent interactions are gathered. */
export const AI_DIGEST_READER_ACTIVITY_WINDOW_DAYS = 180;
const RECENT_POSTS_PER_KIND = 20;
const AFFINITY_LIMIT = 15;
const NEGATIVE_PREFERENCE_LIMIT = 20;
const FOLLOWED_AUTHOR_LIMIT = 100;

type FeedbackReason = "author" | "topic" | "contentType" | "other";
const feedbackReasons: FeedbackReason[] = ["author", "topic", "contentType", "other"];

interface AiDigestReaderRecentPost {
  title: string;
  author: string;
  publishedDaysAgo: number;
  readDaysAgo?: number;
  liked?: "regular" | "strong";
  likedDaysAgo?: number;
  authoredDaysAgo?: number;
  commentedDaysAgo?: number;
}

interface AiDigestReaderNegativePreference {
  kind: "seeLess" | "hidden";
  collection: string | null;
  title: string | null;
  author: string | null;
  topics: string[];
  reasons?: FeedbackReason[];
  feedbackDaysAgo?: number;
  feedbackText?: string;
}

/**
 * What the selection prompts know about the reader, shaped as it appears in
 * them. Day offsets are whole UTC days before the generation date.
 */
export interface AiDigestReaderProfile {
  accountAgeDays: number;
  reads: AiDigestReaderReadStats & {
    /** The share of all reads that one and ten reads make up, for reading the counts below in proportion. */
    oneReadPercent: number | null;
    tenReadsPercent: number | null;
  };
  topAuthorsRead: AiDigestReaderAffinityRow[];
  topTopicsRead: AiDigestReaderAffinityRow[];
  recentPosts: AiDigestReaderRecentPost[];
  followedAuthors: string[];
  negativePreferences: AiDigestReaderNegativePreference[];
}

function percentOfReads(readCount: number, totalReadCount: number): number | null {
  return totalReadCount === 0
    ? null
    : Number(((readCount / totalReadCount) * 100).toPrecision(3));
}

function optionalDaysAgo(asOf: Date, date: Date | null): number | undefined {
  return date ? daysAgo(asOf, date) : undefined;
}

function toRecentPost(row: AiDigestReaderRecentPostRow, asOf: Date): AiDigestReaderRecentPost {
  return {
    title: row.title,
    author: row.author,
    publishedDaysAgo: daysAgo(asOf, row.postedAt),
    readDaysAgo: optionalDaysAgo(asOf, row.readAt),
    liked: row.liked ?? undefined,
    likedDaysAgo: optionalDaysAgo(asOf, row.likedAt),
    authoredDaysAgo: optionalDaysAgo(asOf, row.authoredAt),
    commentedDaysAgo: optionalDaysAgo(asOf, row.commentedAt),
  };
}

function toNegativePreference(row: AiDigestReaderNegativePreferenceRow, asOf: Date): AiDigestReaderNegativePreference {
  return {
    kind: row.kind,
    collection: row.collectionName,
    title: row.title,
    author: row.author,
    topics: row.topics,
    reasons: row.feedbackReasons
      ? feedbackReasons.filter((reason) => row.feedbackReasons?.[reason])
      : undefined,
    feedbackDaysAgo: optionalDaysAgo(asOf, row.feedbackAt),
    feedbackText: row.feedbackReasons?.text?.trim() || undefined,
  };
}

export async function loadAiDigestReaderProfile(
  user: DbUser,
  context: ResolverContext,
  asOf: Date,
): Promise<AiDigestReaderProfile> {
  const { posts, users } = context.repos;
  const userId = user._id;
  const since = new Date(asOf.getTime() - (AI_DIGEST_READER_ACTIVITY_WINDOW_DAYS * DAY_MS));
  const [readStats, topAuthorsRead, topTopicsRead, recentPosts, negativePreferences, followedAuthors] = await Promise.all([
    posts.getAiDigestReaderReadStats({ userId, now: asOf }),
    posts.getAiDigestReaderTopAuthors({ userId, since, limit: AFFINITY_LIMIT }),
    posts.getAiDigestReaderTopTopics({ userId, since, limit: AFFINITY_LIMIT }),
    posts.getAiDigestReaderRecentPosts({ userId, since, limitPerKind: RECENT_POSTS_PER_KIND }),
    posts.getAiDigestReaderNegativePreferences({ userId, since, limit: NEGATIVE_PREFERENCE_LIMIT }),
    users.getAiDigestFollowedAuthorNames({ userId, limit: FOLLOWED_AUTHOR_LIMIT }),
  ]);
  return {
    accountAgeDays: daysAgo(asOf, user.createdAt),
    reads: {
      ...readStats,
      oneReadPercent: percentOfReads(1, readStats.total),
      tenReadsPercent: percentOfReads(10, readStats.total),
    },
    topAuthorsRead,
    topTopicsRead,
    recentPosts: recentPosts.map((row) => toRecentPost(row, asOf)),
    followedAuthors,
    negativePreferences: negativePreferences.map((row) => toNegativePreference(row, asOf)),
  };
}
