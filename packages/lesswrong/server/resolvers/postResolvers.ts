import { Posts } from '../../lib/collections/posts/collection';
import { augmentFieldsDict, denormalizedField } from '../../lib/utils/schemaUtils'
import { getLocalTime } from '../mapsUtils'
import { Utils } from '../../lib/vulcan-lib/utils';
import { getDefaultPostLocationFields } from '../posts/utils'
import { getPostBlockCommentLists } from '../sideComments';
import { addIDsToHTML } from '../tableOfContents';
import cheerio from 'cheerio';

type SideCommentsCache = {
  generatedAt: Date,
  commentsByBlock: Record<string, string[]>,
  generationStartedAt: Date | null, // acts as a lock
}

augmentFieldsDict(Posts, {
  // Compute a denormalized start/end time for events, accounting for the
  // timezone the event's location is in. This is subtly wrong: it computes a
  // correct timestamp, but then the timezone part of that timezone gets lost
  // on the way in/out of the database, so if you use this field, what you're
  // getting is "local time mislabeled as UTC".
  localStartTime: {
    ...denormalizedField({
      needsUpdate: (data) => ('startTime' in data || 'googleLocation' in data),
      getValue: async (post) => {
        if (!post.startTime) return null
        const googleLocation = post.googleLocation || (await getDefaultPostLocationFields(post)).googleLocation
        if (!googleLocation) return null
        return await getLocalTime(post.startTime, googleLocation)
      }
    })
  },
  localEndTime: {
    ...denormalizedField({
      needsUpdate: (data) => ('endTime' in data || 'googleLocation' in data),
      getValue: async (post) => {
        if (!post.endTime) return null
        const googleLocation = post.googleLocation || (await getDefaultPostLocationFields(post)).googleLocation
        if (!googleLocation) return null
        return await getLocalTime(post.endTime, googleLocation)
      }
    })
  },
  sideComments: {
    type: "JSON",
    resolveAs: {
      type: "JSON",
      resolver: async (post: DbPost, args: void, context: ResolverContext) => {
        const toc = await Utils.getToCforPost({document: post, version: null, context});
        const html = toc?.html || post?.contents?.html
        // @ts-ignore DefinitelyTyped annotation is wrong, and cheerio's own annotations aren't ready yet
        const postBody = cheerio.load(html, null, false);
        addIDsToHTML(postBody);

        let commentsByBlock: Record<string, string[]> = {};
        const cache = post.sideCommentsCache as SideCommentsCache;
        const cacheIsValid = cache && cache.generatedAt > post.lastCommentedAt && cache.generatedAt > post.contents?.editedAt
        if (cacheIsValid) {
          commentsByBlock = cache.commentsByBlock;
        } else {
          const minLockDate = new Date(Date.now() - 5 * 60 * 1000);
          const shouldRegenerateCache = !cache || !cache.generationStartedAt || cache.generationStartedAt < minLockDate;
          if (shouldRegenerateCache) {
            const generatedAt = new Date();
            await Posts.rawUpdateOne({_id: post._id}, {$set: {"sideCommentsCache.generationStartedAt": generatedAt}});
            commentsByBlock = await getPostBlockCommentLists(context, post);
            await Posts.rawUpdateOne({_id: post._id}, {$set: {
              sideCommentsCache: {
                generatedAt,
                commentsByBlock,
                generationStartedAt: null,
              },
            }});
          } else {
            // TODO: What do we return here
          }
        }

        return {
          html: postBody.html(),
          commentsByBlock,
        };
      }
    },
  },
})
