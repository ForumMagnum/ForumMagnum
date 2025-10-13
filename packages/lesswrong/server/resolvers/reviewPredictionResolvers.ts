import { accessFilterMultiple } from "@/lib/utils/schemaUtils";
import { getPostMarketInfo, postGetMarketInfoFromManifold } from "@/lib/collections/posts/annualReviewMarkets";
import moment from "moment";
import gql from "graphql-tag";
import { equalNoSharesGuaranteedProfit } from "@/server/review/cpmm";

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

async function fetchMarketFull(marketId: string) {
  const res = await fetch(`https://api.manifold.markets/v0/market/${marketId}`, {
    method: "GET",
    headers: { "content-type": "application/json" },
    cache: 'force-cache',
    next: { revalidate: 300, tags: ['manifold-market', `manifold-market-${marketId}`] },
  });
  if (!res.ok) return null;
  return res.json();
}


export const reviewPredictionGraphQLQueries = {
  async reviewPredictionPosts(_: void, { year, limit }: { year: number, limit?: number }, context: ResolverContext) {
    const start = moment.utc(`${year}-01-01`).toDate();
    const end = moment.utc(`${year + 1}-01-01`).toDate();
    const candidates = await context.Posts.find({
      postedAt: { $gte: start, $lt: end },
      status: 2,
      draft: false,
      shortform: false,
      unlisted: false,
      isEvent: false,
      manifoldReviewMarketId: { $exists: true },
    }, { limit: 2000 }).fetch();

    // Load probabilities; this triggers cache refresh for missing markets
    const withProbs = await Promise.all(candidates.map(async (p) => {
      const info = await getPostMarketInfo(p as DbPost, context);
      return { post: p, info } as const;
    }));

    let unresolvedWithProb = withProbs.filter(x => x.info && x.info.probability != null && !x.info.isResolved);

    // If we don't have enough items with cached probabilities, fetch live from Manifold
    const desired = limit ?? 50;
    if (unresolvedWithProb.length < desired) {
      const remaining = candidates.filter(c => !unresolvedWithProb.some(x => x.post._id === c._id));
      for (const p of remaining) {
        if (!p.manifoldReviewMarketId) continue;
        const live = await postGetMarketInfoFromManifold(p.manifoldReviewMarketId, year);
        if (live && !live.isResolved && typeof live.probability === 'number') {
          // Write to cache for future requests
          try {
            await context.repos.manifoldProbabilitiesCachesRepo.upsertMarketInfoInCache(p.manifoldReviewMarketId, live);
          } catch (_e) { /* ignore cache errors */ }
          unresolvedWithProb.push({ post: p, info: live });
          if (unresolvedWithProb.length >= desired) break;
        }
      }
    }

    const sorted = unresolvedWithProb.sort((a, b) => (b.info!.probability - a.info!.probability) || a.post._id.localeCompare(b.post._id));
    const selected = sorted.slice(0, desired).map(x => x.post);
    return accessFilterMultiple(context.currentUser, 'Posts', selected, context);
  },

  async manifoldPredictionInefficiency(_: void, { year }: { year: number }, context: ResolverContext): Promise<{ inefficiency: number, totalPredicted: number }> {
    // Fetch candidate posts with markets for the year
    const start = moment.utc(`${year}-01-01`).toDate();
    const end = moment.utc(`${year + 1}-01-01`).toDate();
    const posts = await context.Posts.find({
      postedAt: { $gte: start, $lt: end },
      manifoldReviewMarketId: { $exists: true },
      status: 2,
      draft: false,
      shortform: false,
      unlisted: false,
      isEvent: false,
    }, { limit: 2000 }).fetch();
    const marketIds = posts.map(p => p.manifoldReviewMarketId).filter(Boolean) as string[];
    if (!marketIds.length) return { inefficiency: 0, totalPredicted: 0 };

    // Get current probabilities to compute aggregate
    const markets = await Promise.all(marketIds.map(fetchMarketFull));
    const valid = markets.filter(Boolean) as any[];
    if (!valid.length) return { inefficiency: 0, totalPredicted: 0 };

    const probs = valid.map(m => (typeof m.probability === 'number' ? m.probability : 0.5));
    const targetSum = 50;
    const totalPredicted = probs.reduce((acc, p) => acc + p, 0);
    // Compute guaranteed profit via equal NO-shares method (ignore fees)
    const { profit } = equalNoSharesGuaranteedProfit(valid, probs, targetSum);
    return { inefficiency: isFinite(profit) ? Math.max(0, profit) : 0, totalPredicted };
  },
};


