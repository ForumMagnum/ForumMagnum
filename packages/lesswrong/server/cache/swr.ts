import { Posts } from "../../server/collections/posts/collection";
import { PostsMinimumForGetPageUrl, postGetPageUrl } from "../../lib/collections/posts/helpers";
import { loggerConstructor } from "../../lib/utils/logging";
import { serverId } from "@/server/analytics/serverAnalyticsWriter";
import { DatabaseServerSetting } from "../databaseSettings";
import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import { backgroundTask } from "../utils/backgroundTask";

export const swrCachingEnabledSetting = new DatabaseServerSetting<boolean>('swrCaching.enabled', false)
const swrCachingInvalidationIntervalMsSetting = new DatabaseServerSetting<number>('swrCaching.invalidationIntervalMs', 30_000)

const awsRegionSetting = new DatabaseServerSetting<string>('swrCaching.awsRegion', 'us-east-1');
const awsAccessKeyIdSetting = new DatabaseServerSetting<string | null>('swrCaching.accessKeyId', null);
const awsSecretAccessKeySetting = new DatabaseServerSetting<string | null>('swrCaching.secretAccessKey', null);
const cloudFrontDistributionIdSetting = new DatabaseServerSetting<string | null>('swrCaching.distributionId', null);

const INVALIDATION_USER_AGENT = `ForumMagnumCacheInvalidator/1.0 (Server ID: ${serverId})`;

let cloudFrontClient: CloudFrontClient | null = null;
let lastClientRefreshTime: number = Date.now();

const getCloudfrontClient = (): CloudFrontClient | null => {
  const now = Date.now();
  // Refresh the client every 5 minutes
  if (!cloudFrontClient || now - lastClientRefreshTime > 300_000) {
    const region = awsRegionSetting.get();
    const accessKeyId = awsAccessKeyIdSetting.get();
    const secretAccessKey = awsSecretAccessKeySetting.get();

    if (region && accessKeyId && secretAccessKey) {
      cloudFrontClient = new CloudFrontClient({
        region: region,
        credentials: {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey
        }
      });
      lastClientRefreshTime = now;
    }
  }
  return cloudFrontClient;
};

// Invalidation queue
//
// We revalidate pages that are stored in a CDN by:
// 1. Creating an invalidation in CloudFront, this causes the stale page to be removed
// 2. After a 120s delay, pinging the url, which causes the new version to be cached again
//
// Both of these are relatively expensive operations, invalidations cost $0.005 per path, and the revalidation
// generally triggers an SSR on our servers, so we want to limit the rate these are generated.
//
// Invalidation requests are queued up in the following way:
// - In a given [30s] interval:
//   - For each `swrInvalidatePostRoute` call
//     - If the queue is empty, and no invalidation request has been processed in this interval, invalidate the url immediately
//     - Else, add the url to the back of the queue, if it is not present in the queue already
//   - Process 1 item from the queue if it is not empty
//
// So a maximum of 2 invalidation requests will be sent per interval, *per worker*. The request may be processed by a different worker.

const invalidationQueue: string[] = [];
const MAX_LENGTH = 30;
let eager = true;

const invalidateUrlFromQueue = async (): Promise<void> => {
  const logger = loggerConstructor(`swr-invalidation-queue`);
  const url = invalidationQueue.shift();
  if (!url) return;

  const distributionId = cloudFrontDistributionIdSetting.get()
  const client = getCloudfrontClient()
  if (distributionId && client) {
    logger(`Sending invalidation request to CloudFront. URL: ${url}, serverId: ${serverId}`);
    try {
      const path = new URL(url).pathname;
      const invalidationBatch = {
        Paths: {
          Quantity: 1,
          Items: [path],
        },
        CallerReference: `invalidate-${new Date().toISOString()}-${serverId}`, // Unique reference for this invalidation request
      };

      const command = new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: invalidationBatch,
      });

      const response = await client.send(command);
      logger(`Invalidation request sent to CloudFront. Invalidation ID: ${response?.Invalidation?.Id}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Invalidation request to URL failed: ${url}`, error);
    }
  }

  setTimeout(async () => {
    logger(`Sending revalidation request. URL: ${url}, serverId: ${serverId}`);
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
    // CloudFront invalidations can apparently take up to ~100s to complete, so only revalidate the url
    // once this has (almost certainly) finished. Note: in practice I haven't seen one take more than ~20s
  }, 120_000)
};

export const scheduleQueueProcessing = () => {
  // Use setTimeout rather than setInterval to pick up changes to the interval setting without needing to reload the server
  setTimeout(async () => {
    const logger = loggerConstructor(`swr-invalidation-queue`)
    logger(`Running invalidateUrlFromQueue from setTimeout. serverId: ${serverId}`)

    backgroundTask(invalidateUrlFromQueue());
    eager = true;
    scheduleQueueProcessing();
  }, swrCachingInvalidationIntervalMsSetting.get());
};

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
    backgroundTask(invalidateUrlFromQueue());
  }
};

// See packages/lesswrong/server/voteServer.ts for callback on votes
