import { Posts } from "../../lib/collections/posts";
import { PostsMinimumForGetPageUrl, postGetPageUrl } from "../../lib/collections/posts/helpers";
import { onStartup } from "../../lib/executionEnvironment";
import { loggerConstructor } from "../../lib/utils/logging";
import { serverId } from "../analyticsWriter";
import { DatabaseServerSetting } from "../databaseSettings";
import { getCollectionHooks } from "../mutationCallbacks";

export const swrCachingEnabledSetting = new DatabaseServerSetting<boolean>('swrCaching.enabled', false)
const swrCachingInvalidationIntervalMsSetting = new DatabaseServerSetting<number>('swrCaching.invalidationIntervalMs', 30_000)

const INVALIDATION_USER_AGENT = `ForumMagnumCacheInvalidator/1.0 (Server ID: ${serverId})`;

// Invalidation queue
//
// We invalidate pages that are stored in a CDN by pinging the relevant url, this causes the
// CDN to refetch the page from our servers to use as the cached response. This is relatively expensive
// compared to the operation that triggered it, because it triggers a full SSR on one of our servers.
//
// To limit the rate at which SSRs are triggered, invalidation requests are queued up in the following way:
// - In a given [30s] interval:
//   - For each `swrInvalidatePostRoute` call
//     - If the queue is empty, and no invalidation request has been processed in this interval, ping the url immediately
//     - Else, add the url to the back of the queue, if it is not present in the queue already
//   - Process 1 item from the queue if it is not empty
//
// So a maximum of 2 invalidation requests will be sent per interval, *per worker*. The request may be processed by a different worker.

const invalidationQueue: string[] = [];
const MAX_LENGTH = 30;
let eager = true;

const invalidateUrlFromQueue = async (): Promise<void> => {
  const logger = loggerConstructor(`swr-invalidation-queue`)
  const url = invalidationQueue.shift()
  if (!url) return;

  logger(`Sending invalidation request. URL: ${url}, serverId: ${serverId}`)
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': INVALIDATION_USER_AGENT
      }
    });
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error(`Invalidation request to URL failed: ${url}`);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Invalidation request to URL failed: ${url}`, error);
  }
}

const scheduleQueueProcessing = () => {
  // Use setTimeout rather than setInterval to pick up changes to the interval setting without needing to reload the server
  setTimeout(async () => {
    const logger = loggerConstructor(`swr-invalidation-queue`)
    logger(`Running invalidateUrlFromQueue from setTimeout. serverId: ${serverId}`)

    void invalidateUrlFromQueue();
    eager = true;
    scheduleQueueProcessing();
  }, swrCachingInvalidationIntervalMsSetting.get());
};
onStartup(() => {
  scheduleQueueProcessing();
})

/**
 * Invalidate the CDN cache entry for the given post by pinging the URL
 */
export const swrInvalidatePostRoute = async (postId: string) => {
  if (!swrCachingEnabledSetting.get() || invalidationQueue.length > MAX_LENGTH) return;
  const post = await Posts.findOne({_id: postId, swrCachingEnabled: true}, {}, {_id: 1, slug: 1, isEvent: 1, groupId: 1}) as PostsMinimumForGetPageUrl;

  if (!post) return;
  const url = postGetPageUrl(post, true);

  if (invalidationQueue.includes(url)) return;

  invalidationQueue.push(url)
  if (eager) {
    eager = false;
    void invalidateUrlFromQueue();
  }
};

//
// Callbacks for triggering invalidation
//

const postCallback = ({ _id }: { _id: string }) => {
  void swrInvalidatePostRoute(_id);
};

getCollectionHooks("Posts").createAfter.add(postCallback);
getCollectionHooks("Posts").updateAfter.add(postCallback);

const commentCallback = ({ postId }: { postId: string | null }) => {
  if (!postId) return;
  void swrInvalidatePostRoute(postId);
};

getCollectionHooks("Comments").createAfter.add(commentCallback);
getCollectionHooks("Comments").updateAfter.add(commentCallback);

// See packages/lesswrong/server/voteServer.ts for callback on votes
