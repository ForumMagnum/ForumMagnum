import Localgroups from '../../lib/collections/localgroups/collection';
import { cheerioParse } from "../utils/htmlUtil";

export async function getDefaultPostLocationFields(post: DbPost) {
  if (post.isEvent && post.groupId && !post.location) {
    const localgroup = await Localgroups.findOne(post.groupId)
    if (!localgroup) throw Error(`Can't find localgroup to get default post location fields for post: ${post}`)
    const { location, googleLocation, mongoLocation } = localgroup
    return { location, googleLocation, mongoLocation }
  }
  return {}
}

export const getDialogueResponseIds = (post:DbPost) => {
  const html = post.contents.originalContents?.data
  if (!html) return [];

  const $ = cheerioParse(html);
  
  const messageIds: string[] = [];
  $('.dialogue-message').each((idx, element) => {
    const messageId = $(element).attr('message-id');
    if (messageId) messageIds.push(messageId);
  });
  
  return messageIds;
}

export const getDialogueMessageTimestamps = (post: DbPost): Date[] => {
  const html = post.contents.originalContents?.data
  if (!html) return [];
  const $ = cheerioParse(html);
    
  const timestamps: Date[] = [];
  $('.dialogue-message').each((idx, element) => {
    const timestampString = $(element).attr('submitted-date');
    if (timestampString) timestamps.push(new Date(timestampString));
  }); 
  
  return timestamps
}

interface marketInfo {
  id: string;
  probability: number | null;
  outcomeType: string;
  isResolved: boolean
}

const postGetMarketInfoFromManifold = async (post: DbPost): Promise<marketInfo|null> => {
  if (!post.manifoldReviewMarketId) return null;

    const result = await fetch(`https://api.manifold.markets./v0/market/${post.manifoldReviewMarketId}` , {
      method: "GET",
      headers: {
        "content-type": "application/json"
      },
    })
    
    const fullMarket = await result.json() // don't run this and also await result.text(), weirdly that causes the latter one to explode

    if (!result.ok) throw new Error(`HTTP error! status: ${result.status}`);

    // do we want this error to get thrown here?
    if (fullMarket.outcomeType !== "BINARY") throw new Error(`Market ${post.manifoldReviewMarketId} is not a binary market`);

    // const id = fullMarket.id
    // const probability = fullMarket.probability
    // const outcomeType = fullMarket.outcomeType
    // const isResolved = fullMarket.isResolved
  
    return {id:fullMarket.id, probability:fullMarket.probability, outcomeType:fullMarket.outcomeType, isResolved:fullMarket.isResolved}
}


// Define a type for the cache item
interface CacheItem {
  marketInfo: marketInfo | null;
  lastUpdated: Date;
}
// Define a type for the cache object
interface Cache {
  [key: string]: CacheItem;
}

// Create the cache object with the correct type
const postMarketInfoCache: Cache = {};

// Function to update marketInfo in cache
async function updateMarketInfoInCache(post : DbPost) {
  const postId = post._id;
  const marketInfo = await postGetMarketInfoFromManifold(post);

  postMarketInfoCache[postId] = {
    marketInfo,
    lastUpdated: new Date(),
  };
}

// Function to get marketInfo from cache, and update cache if it's been more than 5 minutes since the last update
export const getPostMarketInfo = (post : DbPost) => {
  const postId = post._id;
  const cacheItem = postMarketInfoCache[postId];
  
  const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds

  if (cacheItem) {
    const timeDifference = new Date().getTime() - cacheItem.lastUpdated.getTime();

    // Return the cached marketInfo immediately
    const cachedMarketInfo = cacheItem.marketInfo;

    // If it's been more than 5 minutes since the last update, update the cache asynchronously
    if (timeDifference >= FIVE_MINUTES) {
      updateMarketInfoInCache(post).catch(error => {
        console.error("Failed to update cache for post:", postId, error);
      });
    }

    return cachedMarketInfo;
  }

  // If the item is not in the cache, trigger an asynchronous update and return null
  updateMarketInfoInCache(post).catch(error => {
    console.error("Failed to update cache for post:", postId, error);
  });

  return null; // Return null immediately if the cache is empty
}
