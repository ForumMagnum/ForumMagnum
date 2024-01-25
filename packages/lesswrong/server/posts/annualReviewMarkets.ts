import { AnnualReviewMarketInfo } from "../../lib/annualReviewMarkets";

const postGetMarketInfoFromManifold = async (post: DbPost): Promise<AnnualReviewMarketInfo | null> => {
  if (!post.manifoldReviewMarketId) return null;

  const result = await fetch(`https://api.manifold.markets./v0/market/${post.manifoldReviewMarketId}`, {
    method: "GET",
    headers: {
      "content-type": "application/json"
    },
  })

  const fullMarket = await result.json() // don't run this and also await result.text(), weirdly that causes the latter one to explode

  if (!result.ok) throw new Error(`HTTP error! status: ${result.status}`);

  // do we want this error to get thrown here?
  if (fullMarket.outcomeType !== "BINARY") throw new Error(`Market ${post.manifoldReviewMarketId} is not a binary market`);

  return { probability: fullMarket.probability, isResolved: fullMarket.isResolved, year: post.postedAt.getFullYear() }
}


// Define a type for the cache item
interface CacheItem {
  marketInfo: AnnualReviewMarketInfo | null;
  lastUpdated: Date;
}
// Define a type for the cache object
interface Cache {
  [key: string]: CacheItem;
}

// Create the cache object with the correct type
const postMarketInfoCache: Cache = {};

// Function to update marketInfo in cache
async function updateMarketInfoInCache(post: DbPost) {
  const postId = post._id;
  const marketInfo = await postGetMarketInfoFromManifold(post);

  postMarketInfoCache[postId] = {
    marketInfo,
    lastUpdated: new Date(),
  };
}

// Function to get marketInfo from cache, and update cache if it's been more than 5 minutes since the last update
export const getPostMarketInfo = (post: DbPost) => {
  const postId = post._id;
  const cacheItem = postMarketInfoCache[postId];

  const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  if (!cacheItem) {
    // If the item is not in the cache, trigger an asynchronous update and return null
    updateMarketInfoInCache(post).catch(error => {
      console.error("Failed to initialise cache for post:", postId, error);
    });

    return null;
  }

  const timeDifference = new Date().getTime() - cacheItem.lastUpdated.getTime();

  // If it's been more than 5 minutes since the last update, update the cache asynchronously
  if (timeDifference >= FIVE_MINUTES) {
    updateMarketInfoInCache(post).catch(error => {
      console.error("Failed to update cache for post:", postId, error);
    });
  }

  // Return the cached marketInfo immediately
  return cacheItem.marketInfo
}
