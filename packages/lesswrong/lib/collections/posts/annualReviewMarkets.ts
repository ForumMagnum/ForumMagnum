import { backgroundTask } from "@/server/utils/backgroundTask";
import { manifoldAPIKeySetting, highlightReviewWinnerThresholdSetting } from "../../instanceSettings";
import { getWithCustomLoader, loadByIds } from "../../loaders";
import { filterNonnull } from "../../utils/typeGuardUtils";
import keyBy from "lodash/keyBy";
import { captureException } from "@/lib/sentryWrapper";

// Information about a market, but without bets or comments
export type LiteMarket = {
  // Unique identifer for this market
  id: string

  // Attributes about the creator
  creatorId: string
  creatorUsername: string
  creatorName: string
  creatorAvatarUrl?: string

  // Market atributes
  createdTime: number // When the market was created
  closeTime?: number // Min of creator's chosen date, and resolutionTime
  question: string

  // Note: This url always points to https://manifold.markets, regardless of what instance the api is running on.
  // This url includes the creator's username, but this doesn't need to be correct when constructing valid URLs.
  //   i.e. https://manifold.markets/Austin/test-market is the same as https://manifold.markets/foo/test-market
  url: string

  outcomeType: string // BINARY, FREE_RESPONSE, MULTIPLE_CHOICE, NUMERIC, PSEUDO_NUMERIC, BOUNTIED_QUESTION, POLL, or ...
  mechanism: string // dpm-2, cpmm-1, or cpmm-multi-1

  probability: number
  pool: { outcome: number } // For CPMM markets, the number of shares in the liquidity pool. For DPM markets, the amount of mana invested in each answer.
  p?: number // CPMM markets only, probability constant in y^p * n^(1-p) = k
  totalLiquidity?: number // CPMM markets only, the amount of mana deposited into the liquidity pool

  value?: number // PSEUDO_NUMERIC markets only, the current market value, which is mapped from probability using min, max, and isLogScale.
  min?: number // PSEUDO_NUMERIC markets only, the minimum resolvable value
  max?: number // PSEUDO_NUMERIC markets only, the maximum resolvable value
  isLogScale?: boolean // PSEUDO_NUMERIC markets only, if true `number = (max - min + 1)^probability + minstart - 1`, otherwise `number = min + (max - min) * probability`

  volume: number
  volume24Hours: number

  isResolved: boolean
  resolutionTime?: number
  resolution?: string
  resolutionProbability?: number // Used for BINARY markets resolved to MKT
  uniqueBettorCount: number

  lastUpdatedTime?: number
  lastBetTime?: number
}

export type AnnualReviewMarketInfo = {
  probability: number;
  isResolved: boolean;
  year: number;
  url: string;
}

export const getMarketInfo = (post: PostsBase): AnnualReviewMarketInfo | undefined => {
  if (typeof post.annualReviewMarketProbability !== 'number') return undefined
  if (typeof post.annualReviewMarketIsResolved !== 'boolean') return undefined
  if (typeof post.annualReviewMarketYear !== 'number') return undefined
  if (typeof post.annualReviewMarketUrl !== 'string') return undefined
  return {
    probability: post.annualReviewMarketProbability,
    isResolved: post.annualReviewMarketIsResolved,
    year: post.annualReviewMarketYear,
    url: post.annualReviewMarketUrl,
  }
}

export const highlightMarket = (info: AnnualReviewMarketInfo | undefined): boolean =>
  !!info && !info.isResolved && info.probability > highlightReviewWinnerThresholdSetting.get()


export const postGetMarketInfoFromManifold = async (post: DbPost): Promise<AnnualReviewMarketInfo | null > => {
  if (!post.manifoldReviewMarketId) return null;

  let result;
  try {
    result = await fetch(`https://api.manifold.markets/v0/market/${post.manifoldReviewMarketId}`, {
      method: "GET",
      headers: {
        "content-type": "application/json"
      },
    })
  } catch (error) {
    // We see unhelpful "fetch failed" errors from this request pretty frequently
    // and don't really want them cluttering up the logs
    if (!(error instanceof TypeError && error.message === 'fetch failed')) {
      //eslint-disable-next-line no-console
      console.error('There was a problem with the fetch operation for getting a Manifold Market: ', error);
      captureException(error);
    }
    return null;
  }
  
  if (!result.ok) {
    //eslint-disable-next-line no-console
    console.error(`HTTP error! status: ${result.status}`); 
    return null
  }

  const fullMarket = await result.json()
  
  return { probability: fullMarket.probability, isResolved: fullMarket.isResolved, year: post.postedAt.getFullYear(), url: fullMarket.url }
}

export const createManifoldMarket = async (question: string, descriptionMarkdown: string, closeTime: Date, visibility: string, initialProb: number, idKey: string): Promise<LiteMarket | undefined> => {
  const manifoldAPIKey = manifoldAPIKeySetting.get()

  //eslint-disable-next-line no-console
  if (!manifoldAPIKey) console.error("Manifold API key not found");

  const manifoldLessWrongAnnualReviewTag = "0a0b0d16-7a4b-4de5-aadf-ddd85fbefe5c"
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
        initialProb,
        marketTier: "play",
        groupIds: [manifoldLessWrongAnnualReviewTag],
        idempotencyKey: idKey.slice(0, 10),
        liquidityTier: 1_000,
      })
    })

    if (!result.ok) {
      throw new Error(`HTTP error! status: ${result.status}. body: ${await result.text()}`);
    }

    return result.json()
  } catch (error) {

    //eslint-disable-next-line no-console
    console.error('There was a problem with the fetch operation for creating a Manifold Market: ', error);
    return undefined;
  }
}



async function refreshMarketInfoInCache(post: DbPost, context: ResolverContext) {
  const marketInfo = await postGetMarketInfoFromManifold(post);
  if (!marketInfo || !post.manifoldReviewMarketId) return null;

  await context.repos.manifoldProbabilitiesCachesRepo.upsertMarketInfoInCache(post.manifoldReviewMarketId, marketInfo);
}

export const getPostMarketInfo = async (post: DbPost, context: ResolverContext): Promise<AnnualReviewMarketInfo | undefined>  => {
  if (!post.manifoldReviewMarketId) {
    return undefined;
  }
  
  const cacheItem = await getWithCustomLoader(context, "cachesByMarketId", post.manifoldReviewMarketId, async (ids: string[]) => {
    const probabilitiesCaches = await context.ManifoldProbabilitiesCaches.find({
      marketId: {$in: ids}
    }).fetch();
    const probabilitiesCachesById = keyBy(probabilitiesCaches, c=>c.marketId);
    return ids.map(id => probabilitiesCachesById[id]);
  });

  if (!cacheItem) {
    backgroundTask(refreshMarketInfoInCache(post, context))
    return undefined;
  }

  const timeDifference = new Date().getTime() - cacheItem.lastUpdated.getTime();

  if (timeDifference >= 10_000) {
    backgroundTask(refreshMarketInfoInCache(post, context));
  }

  return { probability: cacheItem.probability, isResolved: cacheItem.isResolved, year: cacheItem.year, url: cacheItem.url ?? '' };
}

/**
 * This function requires currying a resolver context into it so that we can use dataloaders, otherwise when we get a list of posts we end up doing another round trip in here
 */
export const marketInfoLoader = (context: ResolverContext) => async (postIds: string[]) => {
  const posts = filterNonnull(await loadByIds(context, 'Posts', postIds));
  const postMarketInfoPairs = await Promise.all(posts.map(async (post) => ([
    post._id,
    await getPostMarketInfo(post, context)
  ] as const)));

  // Custom loaders are sensitive to the order of ids > entries, and postgres doesn't return things in any guaranteed order
  const postMarketInfoMapping = Object.fromEntries(postMarketInfoPairs);
  return postIds.map(postId => postMarketInfoMapping[postId]);
};
