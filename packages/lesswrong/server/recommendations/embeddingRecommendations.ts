import { loadByIds } from '@/lib/loaders';
import sampleSize from 'lodash/sampleSize';
import { helpers, RecommendedPost } from '../recombee/client';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import { HybridRecombeeConfiguration, RecombeeConfiguration } from '@/lib/collections/users/recommendationSettings';

export async function getEmbeddingRecommendationsForUser(
  userId: string,
  limit: number,
  settings: HybridRecombeeConfiguration,
  context: ResolverContext
): Promise<RecommendedPost[]> {

  const selectedUserId = settings.userId ?? userId

  const oversamplingFactor = 10
  const fractionRecommendationPosts = 0.8
  const numRecommendationPosts = Math.floor(limit * fractionRecommendationPosts)
  const numLatestPosts = limit - numRecommendationPosts

  //get recommendations from postEmbeddingsRepo
  const embeddingRecommendationPostsIds = await context.repos.postEmbeddings.getEmbeddingRecommendationsForUser(selectedUserId, numRecommendationPosts * oversamplingFactor);
  const randomSampleEmbeddingRecommendationPostsIds = sampleSize(embeddingRecommendationPostsIds, numRecommendationPosts)
  const embeddingRecommendationPosts = filterNonnull(await loadByIds(context, 'Posts', randomSampleEmbeddingRecommendationPostsIds))

  //get latest posts
  // TODO: This currently doesn't adjust for user customization stuff
  const latestPosts = await helpers.getNativeLatestPostsPromise({hybridScenarios: {fixed: 'latest', configurable: 'embedding'}}, numLatestPosts, 0, randomSampleEmbeddingRecommendationPostsIds, context)

  const posts: RecommendedPost[] = [
    ...embeddingRecommendationPosts.map((post) => ({
      post,
      scenario: 'embedding',
      recommId: post._id,
      curated: false,
      stickied: false
    })),
    ...latestPosts.map((post) => ({
      post,
      curated: false,
      stickied: false
    }))
  ]

  //interleave posts
  const interleavedPosts = helpers.interleaveHybridRecommendedPosts(posts)

  return interleavedPosts
}

