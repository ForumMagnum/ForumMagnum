import { AnnualReviewMarketInfo } from "../../lib/annualReviewMarkets";
import ManifoldProbabilitiesCaches from "../../lib/collections/manifoldProbabilitiesCaches/collection";
import { createAdminContext, createMutator } from "../vulcan-lib";

const postGetMarketInfoFromManifold = async (post: DbPost): Promise<AnnualReviewMarketInfo | null > => {
  if (!post.manifoldReviewMarketId) return null;

  const result = await fetch(`https://api.manifold.markets./v0/market/${post.manifoldReviewMarketId}`, {
    method: "GET",
    headers: {
      "content-type": "application/json"
    },
  })
  
  if (!result.ok) throw new Error(`HTTP error! status: ${result.status}`);

  const fullMarket = await result.json()
  if (fullMarket.probability == null) throw new Error("Manifold market probability is null");
  if (fullMarket.isResolved == null) throw new Error("Manifold market isResolved is null");
  if (fullMarket.postedAt == null) throw new Error("Manifold market postedAt is null");

  return { probability: fullMarket.probability, isResolved: fullMarket.isResolved, year: post.postedAt.getFullYear() }
}


async function updateMarketInfoInCache(post: DbPost) {
  const marketInfo = await postGetMarketInfoFromManifold(post);
  if (!marketInfo || !post.manifoldReviewMarketId) return null;

  await createMutator({
    collection: ManifoldProbabilitiesCaches,
    document: {
      marketId: post.manifoldReviewMarketId,
      probability: marketInfo.probability,
      isResolved: marketInfo.isResolved,
      year: marketInfo.year,
      lastUpdated: new Date(),
    },
    context: createAdminContext(),
  }).catch(error => {
    // eslint-disable-next-line no-console
    console.error("Failed to update cache for post:", post._id, error.data.errors);
  })
}

export const getPostMarketInfo = async (post: DbPost) => {
  const postId = post._id;
  const cacheItem = await ManifoldProbabilitiesCaches.findOne({
    marketId: post.manifoldReviewMarketId
  });
  
  if (!cacheItem) {
    updateMarketInfoInCache(post).catch(error => {
      // eslint-disable-next-line no-console
      console.error("Failed to initialise cache for post:", postId, error);
    });

    return null;
  }

  const timeDifference = new Date().getTime() - cacheItem.lastUpdated.getTime();

  if (timeDifference >= 2 * 1000) {
    updateMarketInfoInCache(post).catch(error => {
      // eslint-disable-next-line no-console
      console.error("Failed to update cache for post:", postId, error);
    });
  }

  return { probability: cacheItem.probability, isResolved: cacheItem.isResolved, year: cacheItem.year };
}
