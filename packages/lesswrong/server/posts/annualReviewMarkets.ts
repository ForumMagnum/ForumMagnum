import { AnnualReviewMarketInfo } from "../../lib/annualReviewMarkets";
import ManifoldProbabilitiesCaches from "../../lib/collections/manifoldProbabilitiesCaches/collection";
import Posts from "../../lib/collections/posts/collection";
import { manifoldAPIKeySetting } from "../../lib/instanceSettings";
import { createAdminContext } from "../vulcan-lib";

const manifoldAPIKey = manifoldAPIKeySetting.get()

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

export const createManifoldMarket = async (question: string, descriptionMarkdown: string, closeTime: Date, visibility: string, initialProb: number) => {
  if (!manifoldAPIKey) throw new Error("Manifold API key not found");

  try {
    const result = await fetch("https://api.manifold.markets/v0/market", {
      method: "POST",
      headers: {
        authorization: `Key ${manifoldAPIKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        outcomeType: "BINARY",
        question,
        descriptionMarkdown,
        closeTime: Number(closeTime),
        visibility,
        initialProb
      })
    })

    if (!result.ok) {
      throw new Error(`HTTP error! status: ${result.status}`);
    }

    return result.json()
  } catch (error) {

    //eslint-disable-next-line no-console
    console.error('There was a problem with the fetch operation for creating a Manifold Market: ', error);
  }
}



async function refreshMarketInfoInCache(post: DbPost) {
  const marketInfo = await postGetMarketInfoFromManifold(post);
  if (!marketInfo || !post.manifoldReviewMarketId) return null;

  const context = createAdminContext();

  await context.repos.manifoldProbabilitiesCachesRepo.upsertMarketInfoInCache(post.manifoldReviewMarketId, marketInfo);
}

export const getPostMarketInfo = async (post: DbPost): Promise<AnnualReviewMarketInfo | undefined>  => {
  const cacheItem = await ManifoldProbabilitiesCaches.findOne({
    marketId: post.manifoldReviewMarketId
  });

  if (!cacheItem) {
    void refreshMarketInfoInCache(post)
    return undefined;
  }

  const timeDifference = new Date().getTime() - cacheItem.lastUpdated.getTime();

  if (timeDifference >= 10_000) {
    void refreshMarketInfoInCache(post);
  }

  return { probability: cacheItem.probability, isResolved: cacheItem.isResolved, year: cacheItem.year };
}

export const marketInfoLoader = async (postIds: string[]) => {
  const posts = await Posts.find({ _id: { $in: postIds } }).fetch();
  const postMarketInfoPairs = await Promise.all(posts.map(async (post) => ([
    post._id,
    await getPostMarketInfo(post)
  ] as const)));

  // Custom loaders are sensitive to the order of ids > entries, and `.find` doesn't return things in any guaranteed order (since postgres doesn't)
  const postMarketInfoMapping = Object.fromEntries(postMarketInfoPairs);
  return postIds.map(postId => postMarketInfoMapping[postId]);
};
