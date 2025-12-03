import { accessFilterMultiple } from "@/lib/utils/schemaUtils";
import { getPostMarketInfo } from "@/lib/collections/posts/annualReviewMarkets";
import moment from "moment";
import gql from "graphql-tag";

export const reviewPredictionGraphQLTypeDefs = gql`
  extend type Query {
    reviewPredictionPosts(year: Int!, limit: Int = 50): [Post!]!
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
    const candidates = await fetchCandidatePosts(year, context);
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
};


