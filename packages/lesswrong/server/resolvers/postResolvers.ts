import { Posts } from '../../lib/collections/posts/collection';
import { sideCommentFilterMinKarma, sideCommentAlwaysExcludeKarma } from '../../lib/collections/posts/constants';
import { Comments } from '../../lib/collections/comments/collection';
import { SideCommentsCache, SideCommentsResolverResult, sideCommentCacheVersion } from '../../lib/collections/posts/schema';
import { denormalizedField } from '../../lib/utils/schemaUtils'
import { augmentFieldsDict } from '../utils/serverSchemaUtils';
import { getLocalTime } from '../mapsUtils'
import { isNotHostedHere } from '../../lib/collections/posts/helpers';
import { getDefaultPostLocationFields } from '../posts/utils'
import { matchSideComments } from '../sideComments';
import { captureException } from '@sentry/core';
import { getToCforPost } from '../tableOfContents';
import { getDefaultViewSelector } from '../../lib/utils/viewUtils';
import { getUnusedSlugByCollectionName } from '../utils/slugUtils';
import { slugify } from '../../lib/vulcan-lib/utils';
import keyBy from 'lodash/keyBy';
import GraphQLJSON from 'graphql-type-json';

augmentFieldsDict(Posts, {
  slug: {
    onInsert: async (post) => {
      return await getUnusedSlugByCollectionName("Posts", slugify(post.title))
    },
    onEdit: async (modifier, post) => {
      if (modifier.$set.title) {
        return await getUnusedSlugByCollectionName("Posts", slugify(modifier.$set.title), false, post._id)
      }
    }
  },

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
  tableOfContents: {
    resolveAs: {
      type: GraphQLJSON,
      resolver: async (document: DbPost, args: void, context: ResolverContext) => {
        try {
          return await getToCforPost({document, version: null, context});
        } catch(e) {
          captureException(e);
          return null;
        }
    },
    },
  },
  tableOfContentsRevision: {
    resolveAs: {
      type: GraphQLJSON,
      arguments: 'version: String',
      resolver: async (document: DbPost, args: {version:string}, context: ResolverContext) => {
        const { version=null } = args;
        try {
          return await getToCforPost({document, version, context});
        } catch(e) {
          captureException(e);
          return null;
        }
      },
    }
  },
  sideComments: {
    resolveAs: {
      type: GraphQLJSON,
      resolver: async (post: DbPost, args: void, context: ResolverContext): Promise<SideCommentsResolverResult|null> => {
        if (isNotHostedHere(post)) {
          return null;
        }
        const cache = post.sideCommentsCache as SideCommentsCache|undefined;
        const cacheIsValid = cache
          && cache.generatedAt>post.lastCommentedAt
          && cache.generatedAt > post.contents?.editedAt
          && cache.version === sideCommentCacheVersion;
        let unfilteredResult: {annotatedHtml: string, commentsByBlock: Record<string,string[]>}|null = null;
        
        const now = new Date();
        const comments = await Comments.find({
          ...getDefaultViewSelector("Comments"),
          postId: post._id,
        }).fetch();
        
        if (cacheIsValid) {
          unfilteredResult = {annotatedHtml: cache.annotatedHtml, commentsByBlock: cache.commentsByBlock};
        } else {
          const toc = await getToCforPost({document: post, version: null, context});
          const html = toc?.html || post?.contents?.html
          const sideCommentMatches = await matchSideComments({
            postId: post._id,
            html: html,
            comments: comments.map(comment => ({_id: comment._id, html: comment.contents?.html ?? ""})),
          });
          
          const newCacheEntry = {
            version: sideCommentCacheVersion,
            generatedAt: now,
            annotatedHtml: sideCommentMatches.html,
            commentsByBlock: sideCommentMatches.sideCommentsByBlock,
          }
          
          await Posts.rawUpdateOne({_id: post._id}, {$set: {"sideCommentsCache": newCacheEntry}});
          unfilteredResult = {
            annotatedHtml: sideCommentMatches.html,
            commentsByBlock: sideCommentMatches.sideCommentsByBlock
          };
        }

        const alwaysShownIds = new Set<string>([]);
        alwaysShownIds.add(post.userId);
        if (post.coauthorStatuses) {
          for (let {userId} of post.coauthorStatuses) {
            alwaysShownIds.add(userId);
          }
        }

        const commentsById = keyBy(comments, comment=>comment._id);
        let highKarmaCommentsByBlock: Record<string,string[]> = {};
        let nonnegativeKarmaCommentsByBlock: Record<string,string[]> = {};
        
        for (let blockID of Object.keys(unfilteredResult.commentsByBlock)) {
          const commentIdsHere = unfilteredResult.commentsByBlock[blockID];
          const highKarmaCommentIdsHere = commentIdsHere.filter(commentId => {
            const comment: DbComment = commentsById[commentId];
            if (!comment)
              return false;
            else if (comment.baseScore >= sideCommentFilterMinKarma)
              return true;
            else if (alwaysShownIds.has(comment.userId))
              return true;
            else
              return false;
          });
          if (highKarmaCommentIdsHere.length > 0) {
            highKarmaCommentsByBlock[blockID] = highKarmaCommentIdsHere;
          }
          
          const nonnegativeKarmaCommentIdsHere = commentIdsHere.filter(commentId => {
            const comment: DbComment = commentsById[commentId];
            if (!comment)
              return false;
            else if (alwaysShownIds.has(comment.userId))
              return true;
            else if (comment.baseScore <= sideCommentAlwaysExcludeKarma)
              return false;
            else
              return true;
          });
          if (nonnegativeKarmaCommentIdsHere.length > 0) {
            nonnegativeKarmaCommentsByBlock[blockID] = nonnegativeKarmaCommentIdsHere;
          }
        }
        
        return {
          html: unfilteredResult.annotatedHtml,
          commentsByBlock: nonnegativeKarmaCommentsByBlock,
          highKarmaCommentsByBlock: highKarmaCommentsByBlock,
        }
      }
    },
  },
})
