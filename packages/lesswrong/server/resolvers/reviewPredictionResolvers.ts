import { accessFilterMultiple } from "@/lib/utils/schemaUtils";
import { getPostMarketInfo } from "@/lib/collections/posts/annualReviewMarkets";
import moment from "moment";
import gql from "graphql-tag";
import { equalNoSharesGuaranteedProfit } from "@/server/review/cpmm";
import { getWithCustomLoader } from "@/lib/loaders";

export const reviewPredictionGraphQLTypeDefs = gql`
  type PredictionInefficiency {
    inefficiency: Float!
    totalPredicted: Float!
  }
  extend type Query {
    reviewPredictionPosts(year: Int!, limit: Int = 50): [Post!]!
    manifoldPredictionInefficiency(year: Int!): PredictionInefficiency!
  }
`;

// Shared helper to fetch candidate posts for a given year
async function fetchCandidatePosts(year: number, context: ResolverContext): Promise<DbPost[]> {
  const start = moment.utc(`${year}-01-01`).toDate();
  const end = moment.utc(`${year + 1}-01-01`).toDate();
  return context.Posts.find({
    postedAt: { $gte: start, $lt: end },
    status: 2,
    draft: false,
    shortform: false,
    unlisted: false,
    isEvent: false,
    manifoldReviewMarketId: { $exists: true },
  }, { limit: 2000 }).fetch();
}

export const reviewPredictionGraphQLQueries = {
  async reviewPredictionPosts(_: void, { year, limit }: { year: number, limit?: number }, context: ResolverContext) {
    console.time('reviewPredictionPosts');
    const candidates = await fetchCandidatePosts(year, context);
    console.timeEnd('reviewPredictionPosts');
    // Load probabilities; this triggers cache refresh for missing markets
    const withProbs = await Promise.all(candidates.map(async (p: DbPost) => {
      const info = await getPostMarketInfo(p, context);
      return { post: p, info } as const;
    }));

    let unresolvedWithProb = withProbs.filter(x => x.info && x.info.probability != null && !x.info.isResolved);

    const sorted = unresolvedWithProb.sort((a, b) => (b.info!.probability - a.info!.probability) || a.post._id.localeCompare(b.post._id));
    const selected = sorted.slice(0, limit ?? 50).map(x => x.post);
    return accessFilterMultiple(context.currentUser, 'Posts', selected, context);
  },

  async manifoldPredictionInefficiency(_: void, { year }: { year: number }, context: ResolverContext): Promise<{ inefficiency: number, totalPredicted: number }> {
    const posts = await fetchCandidatePosts(year, context);

    // First, check cache to filter out resolved markets (optimization)
    const postsWithCacheInfo = await Promise.all(posts.map(async (p) => {
      const info = await getPostMarketInfo(p, context);
      return { post: p, info };
    }));

    const unresolvedPosts = postsWithCacheInfo.filter(x => !x.info?.isResolved);
    if (!unresolvedPosts.length) return { inefficiency: 0, totalPredicted: 0 };


    const probs = unresolvedPosts.map(({info}) => (typeof info?.probability === 'number' ? info.probability : 0.5));
    const targetSum = 50;
    const totalPredicted = probs.reduce((acc, p) => acc + p, 0);
    // Compute guaranteed profit via equal NO-shares method (ignore fees)
    const shaped = unresolvedPosts.map(({info}) => ({ mechanism: info?.mechanism, pool: info?.pool, p: info?.p }));
    const { profit } = equalNoSharesGuaranteedProfit(shaped, probs, targetSum);
    return { inefficiency: isFinite(profit) ? Math.max(0, profit) : 0, totalPredicted };
  },
};


