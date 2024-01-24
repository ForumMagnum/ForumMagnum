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

const postGetProbabilityReviewWinner = async (post: DbPost): Promise<number|null> => {
  if (!post.manifoldReviewMarketId) return null;

    const result = await fetch(`https://api.manifold.markets./v0/market/${post.manifoldReviewMarketId}` , {
      method: "GET",
      headers: {
        "content-type": "application/json"
      },
    })
    
    const fullMarket = await result.json() // don't run this and also await result.text(), weirdly that causes the latter one to explode

    if (!result.ok) throw new Error(`HTTP error! status: ${result.status}`);
    if (fullMarket.outcomeType !== "BINARY") throw new Error(`Market ${post.manifoldReviewMarketId} is not a binary market`);

    return fullMarket.probability
}


// Define a type for the cache item
interface CacheItem {
  probability: number | null;
  lastUpdated: Date;
}
// Define a type for the cache object
interface Cache {
  [key: string]: CacheItem;
}

// Create the cache object with the correct type
const postProbabilityReviewWinnerCache: Cache = {};

// Function to update probability in cache
async function updateProbabilityInCache(post : DbPost) {
  const postId = post._id;
  const probability = await postGetProbabilityReviewWinner(post);
  postProbabilityReviewWinnerCache[postId] = {
    probability,
    lastUpdated: new Date(),
  };
}

// Function to get probability from cache, and update cache if it's been more than 5 minutes since the last update
export const getPostProbabilityReviewWinner = (post : DbPost) => {
  const postId = post._id;
  const cacheItem = postProbabilityReviewWinnerCache[postId];
  
  const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds

  if (cacheItem) {
    const timeDifference = new Date().getTime() - cacheItem.lastUpdated.getTime();

    // Return the cached probability immediately
    const cachedProbability = cacheItem.probability;

    // If it's been more than 5 minutes since the last update, update the cache asynchronously
    if (timeDifference >= FIVE_MINUTES) {
      updateProbabilityInCache(post).catch(error => {
        console.error("Failed to update cache for post:", postId, error);
      });
    }

    return cachedProbability;
  }

  // If the item is not in the cache, trigger an asynchronous update and return null
  updateProbabilityInCache(post).catch(error => {
    console.error("Failed to update cache for post:", postId, error);
  });

  return null; // Return null immediately if the cache is empty
}
