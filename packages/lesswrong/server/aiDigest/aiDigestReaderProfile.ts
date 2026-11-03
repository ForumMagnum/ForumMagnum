import { DAY_MS } from "@/lib/aiDigest/constants";
import type {
  AiDigestReaderAffinityRow,
  AiDigestReaderNegativePreferenceRow,
  AiDigestReaderReadStats,
  AiDigestReaderRecentPostRow,
} from "@/server/repos/PostsRepo";
import { aiDigestPromptSection } from "./aiDigestModelCalls";

const AI_DIGEST_READER_ACTIVITY_WINDOW_DAYS = 180;
const RECENT_POSTS_PER_KIND = 20;
const AFFINITY_LIMIT = 15;
const NEGATIVE_PREFERENCE_LIMIT = 20;
const FOLLOWED_AUTHOR_LIMIT = 100;

export interface AiDigestReaderProfile {
  accountCreatedAt: Date;
  reads: AiDigestReaderReadStats;
  topAuthorsRead: AiDigestReaderAffinityRow[];
  topTopicsRead: AiDigestReaderAffinityRow[];
  recentPosts: AiDigestReaderRecentPostRow[];
  followedAuthors: string[];
  negativePreferences: AiDigestReaderNegativePreferenceRow[];
}

export async function loadAiDigestReaderProfile(
  user: DbUser,
  context: ResolverContext,
  asOf: Date,
): Promise<AiDigestReaderProfile> {
  const { posts, users } = context.repos;
  const userId = user._id;
  const since = new Date(asOf.getTime() - (AI_DIGEST_READER_ACTIVITY_WINDOW_DAYS * DAY_MS));
  const [reads, topAuthorsRead, topTopicsRead, recentPosts, negativePreferences, followedAuthors] = await Promise.all([
    posts.getAiDigestReaderReadStats({ userId, now: asOf }),
    posts.getAiDigestReaderTopAuthors({ userId, since, limit: AFFINITY_LIMIT }),
    posts.getAiDigestReaderTopTopics({ userId, since, limit: AFFINITY_LIMIT }),
    posts.getAiDigestReaderRecentPosts({ userId, since, limitPerKind: RECENT_POSTS_PER_KIND }),
    posts.getAiDigestReaderNegativePreferences({ userId, since, limit: NEGATIVE_PREFERENCE_LIMIT }),
    users.getAiDigestFollowedAuthorNames({ userId, limit: FOLLOWED_AUTHOR_LIMIT }),
  ]);
  return {
    accountCreatedAt: user.createdAt,
    reads,
    topAuthorsRead,
    topTopicsRead,
    recentPosts,
    followedAuthors,
    negativePreferences,
  };
}

export function aiDigestReaderPromptSections(profile: AiDigestReaderProfile, personalInstructions: string | null): string[] {
  const sections = [aiDigestPromptSection({
    heading: "Reader profile",
    note: `Affinities and recent posts cover the last ${AI_DIGEST_READER_ACTIVITY_WINDOW_DAYS} days.`,
    label: "READER_PROFILE",
    value: profile,
  })];
  if (personalInstructions) {
    sections.push(aiDigestPromptSection({
      heading: "Reader's explicit content preferences",
      label: "READER_INSTRUCTIONS",
      value: personalInstructions,
    }));
  }
  return sections;
}
