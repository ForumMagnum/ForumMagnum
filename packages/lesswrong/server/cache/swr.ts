import { Posts } from "../../lib/collections/posts";
import { PostsMinimumForGetPageUrl, postGetPageUrl } from "../../lib/collections/posts/helpers";
import { serverId } from "../analyticsWriter";
import { swrCachingEnabledSetting } from "../cacheControlMiddleware";
import { getCollectionHooks } from "../mutationCallbacks";

const INVALIDATION_USER_AGENT = `ForumMagnumCacheInvalidator/1.0 (Server ID: ${serverId})`;

/**
 * Invalidate the CDN cache entry for the given post by pinging the URL
 */
export const swrInvalidatePostRoute = async (postId: string) => {
  if (!swrCachingEnabledSetting.get()) return;
  const post = await Posts.findOne({_id: postId}, {}, {_id: 1, slug: 1, isEvent: 1, groupId: 1}) as PostsMinimumForGetPageUrl;

  if (!post) return;
  const url = postGetPageUrl(post, true);

  console.log("Sending invalidation request")
  fetch(url, {
    headers: {
      'User-Agent': INVALIDATION_USER_AGENT
    }
  }).then(response => {
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error(`Invalidation request to URL failed: ${url}`);
    }
  }).catch(error => {
    // eslint-disable-next-line no-console
    console.error(`Invalidation request to URL failed: ${url}`, error);
  });
};

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
