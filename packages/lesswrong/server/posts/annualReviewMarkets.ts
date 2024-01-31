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
  if (fullMarket.probability === null) throw new Error("Manifold market probability is null");
  if (fullMarket.isResolved === null) throw new Error("Manifold market isResolved is null");

  return { probability: fullMarket.probability, isResolved: fullMarket.isResolved, year: post.postedAt.getFullYear() }
}


async function updateMarketInfoInCache(post: DbPost) {
  const marketInfo = await postGetMarketInfoFromManifold(post);
  if (!marketInfo || !post.manifoldReviewMarketId) return null;

  const context = createAdminContext();

  await context.repos.manifoldProbabilitiesCachesRepo.upsertMarketInfoInCache(post.manifoldReviewMarketId, marketInfo.probability, marketInfo.isResolved, marketInfo.year);
}

export const getPostMarketInfo = async (post: DbPost): Promise<AnnualReviewMarketInfo | undefined>  => {
  const cacheItem = await ManifoldProbabilitiesCaches.findOne({
    marketId: post.manifoldReviewMarketId
  });

  if (!cacheItem) {
    await updateMarketInfoInCache(post)
    return undefined;
  }

  const timeDifference = new Date().getTime() - cacheItem.lastUpdated.getTime();

  if (timeDifference >= 10_000) {
    await updateMarketInfoInCache(post);
  }

  return { probability: cacheItem.probability, isResolved: cacheItem.isResolved, year: cacheItem.year };
}
