import { Posts } from "@/lib/collections/posts/collection.ts";
import { manifoldAPIKeySetting } from "@/lib/instanceSettings";
import { postGetMarketInfoFromManifold, LiteMarket } from "@/lib/collections/posts/annualReviewMarkets";
import { sleep } from "@/lib/utils/asyncUtils";

const manifoldAPIKey = manifoldAPIKeySetting.get()

export const getMarketInfoFromManifold = async (marketId: string): Promise<LiteMarket | null > => {

  const result = await fetch(`https://api.manifold.markets./v0/market/${marketId}`, {
    method: "GET",
    headers: {
      "content-type": "application/json"
    },
  })
  
  if (!result.ok) {
    //eslint-disable-next-line no-console
    console.error(`HTTP error! status: ${result.status}`); 
    return null
  }

  return result.json()
}

export const resolveReviewMarkets = async (year: number, limit?: number) => {

  const resolutionLimitOptions = limit ? {limit} : {}

  const postsToResolve = await Posts.find({
    manifoldReviewMarketId: {$exists: true},
    createdAt: {$gte: new Date(`${year}-01-01`), $lt: new Date(`${year+1}-01-01`)}
  }, resolutionLimitOptions).fetch()

  const postsResolvingYes = await Posts.find({
    createdAt: {$gte: new Date(`${year}-01-01`), $lt: new Date(`${year+1}-01-01`)},
  }, {
    limit: 50,
    sort: {
      reviewVoteScoreHighKarma: -1
    }
  }).fetch()

  const resolveReviewMarket = async (post: DbPost) => {
    if (!post.manifoldReviewMarketId) {
      //eslint-disable-next-line no-console
      console.error(`No manifoldReviewMarketId for post ${post.title}`)
      return
    }
    const market = await getMarketInfoFromManifold(post.manifoldReviewMarketId)
    if (!market) {
      //eslint-disable-next-line no-console
      console.error(`Market not found for post ${post.title} with manifoldReviewMarketId ${post.manifoldReviewMarketId}`)
      return
    }
    if (market.isResolved) {
      //eslint-disable-next-line no-console
      console.log(`Market ${market.url} is already resolved`)
      return
    }
    const reviewMarketId = market.id
    const isWinner = postsResolvingYes.some(p => p._id === post._id)
    // post to manifold API with the resolution
    const result = await fetch(`https://api.manifold.markets/v0/market/${reviewMarketId}/resolve`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Authorization": `Key ${manifoldAPIKey}`
      },
      body: JSON.stringify({outcome: isWinner ? "YES" : "NO"})
    })

    if (!result.ok) {
      //eslint-disable-next-line no-console
      console.error(`Failed to resolve market ${reviewMarketId} for post ${post.title}`, {result})
      return
    }
    //eslint-disable-next-line no-console
    console.log(`Resolved market ${reviewMarketId} for post ${post.title} as ${isWinner ? "YES" : "NO"}`)

    return result.json()
  }

  for (const post of postsToResolve) {
    await resolveReviewMarket(post)
    await sleep(200)
  }
}

