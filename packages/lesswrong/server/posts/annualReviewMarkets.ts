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

  const fullMarket = await result.json()

  if (!result.ok) throw new Error(`HTTP error! status: ${result.status}`);


  // do we want this error to get thrown here?
  if (fullMarket.outcomeType !== "BINARY") throw new Error(`Market ${post.manifoldReviewMarketId} is not a binary market`);

  return { probability: fullMarket.probability, isResolved: fullMarket.isResolved, year: post.postedAt.getFullYear() }
}


// Function to update marketInfo in cache
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

// Function to get marketInfo from cache, and update cache if it's been more than 2 seconds since the last update
export const getPostMarketInfo = async (post: DbPost) => {
  const postId = post._id;
  const cacheItem = await ManifoldProbabilitiesCaches.findOne({
    marketId: post.manifoldReviewMarketId
  });

  const TWO_SECONDS = 2 * 1000; // 2 seconds in milliseconds
  
  if (!cacheItem) {
    // If the item is not in the cache, trigger an asynchronous update and return null
    updateMarketInfoInCache(post).catch(error => {
      // eslint-disable-next-line no-console
      console.error("Failed to initialise cache for post:", postId, error);
    });

    return null;
  }

  const timeDifference = new Date().getTime() - cacheItem.lastUpdated.getTime();

  // If it's been more than 5 minutes since the last update, update the cache asynchronously
  if (timeDifference >= TWO_SECONDS) {
    updateMarketInfoInCache(post).catch(error => {
      // eslint-disable-next-line no-console
      console.error("Failed to update cache for post:", postId, error);
    });
  }

  // Return the cached marketInfo immediately
  return { probability: cacheItem.probability, isResolved: cacheItem.isResolved, year: cacheItem.year };
}
