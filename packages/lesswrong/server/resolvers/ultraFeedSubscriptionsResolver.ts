import gql from 'graphql-tag';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import { randomId } from '@/lib/random';
import { buildDistinctLinearThreads, generateThreadHash } from '@/server/ultraFeed/ultraFeedThreadHelpers';
import { FilterSettings } from '@/lib/filterSettings';
import { 
  loadMultipleEntitiesById, 
  insertUltraFeedEvents, 
  createUltraFeedResponse,
  UltraFeedEventInsertData,
  insertSubscriptionSuggestions,
  getSubscriptionSuggestedUsers
} from './ultraFeedResolverHelpers';

type SubscribedFeedEntryType = 'feedPost' | 'feedCommentThread' | 'feedSubscriptionSuggestions';

interface SubscribedFeedDateCutoffs {
  initialCommentCandidateLookbackDays: number;
  commentServedEventRecencyHours: number;
}

const SUBSCRIBED_FEED_DATE_CUTOFFS: SubscribedFeedDateCutoffs = {
  initialCommentCandidateLookbackDays: 30,
  commentServedEventRecencyHours: 48,
};

export const ultraFeedSubscriptionsTypeDefs = gql`
  extend type Query {
    UltraFeedSubscriptions(
      limit: Int,
      cutoff: Date,
      offset: Int
    ): UltraFeedQueryResults!
  }
`;

interface UltraFeedSubscriptionsArgs {
  limit?: number;
  cutoff?: Date | null;
  offset?: number;
}

interface SliceTarget {
  commentId: string;
  postedAt: Date;
}

export const ultraFeedSubscriptionsQueries = {
  UltraFeedSubscriptions: async (_root: void, args: UltraFeedSubscriptionsArgs, context: ResolverContext) => {
    const { currentUser } = context;
    if (!currentUser) throw new Error('Must be logged in to fetch UltraFeedSubscriptions.');

    const limit = args.limit ?? 20;
    const offset = args.offset ?? 0;
    const cutoff = args.cutoff ?? null;

    const postsRepo = context.repos.posts;
    const commentsRepo = context.repos.comments;

    const subscribedPostFilterSettings: FilterSettings = {
      tags: [],
      personalBlog: 'Default',
    };

    const postRows = await postsRepo.getLatestAndSubscribedFeedPosts(
      context, 
      subscribedPostFilterSettings, 
      60, 
      1000, 
      true // restrictToFollowedAuthors
    );

    const subscriptionComments = await commentsRepo.getCommentsForFeed(
      currentUser._id, 
      2000, 
      SUBSCRIBED_FEED_DATE_CUTOFFS.initialCommentCandidateLookbackDays,
      SUBSCRIBED_FEED_DATE_CUTOFFS.commentServedEventRecencyHours,
      true
    );

    const postIdsFromPosts = postRows.map(r => r.post._id).filter((id): id is string => !!id);
    const postIdsFromComments: string[] = Array.from(new Set(subscriptionComments.map(c => c.postId)));
    const allPostIds = Array.from(new Set([...postIdsFromPosts, ...postIdsFromComments]));

    const commentIds = subscriptionComments.map(c => c.commentId);

    const { postsById, commentsById } = await loadMultipleEntitiesById(context, {
      posts: allPostIds,
      comments: commentIds
    });

    const targetsByHourAndThread = new Map<string, Map<string, SliceTarget[]>>();

    for (const c of subscriptionComments) {
      if (!c.isInitialCandidate || !c.postedAt) continue;
      const hourKey = new Date(c.postedAt);
      hourKey.setMinutes(0, 0, 0);
      const hourStr = hourKey.toISOString();
      const threadId = c.topLevelCommentId ?? c.commentId;
      if (!targetsByHourAndThread.has(hourStr)) {
        targetsByHourAndThread.set(hourStr, new Map());
      }
      const byThread = targetsByHourAndThread.get(hourStr)!;
      if (!byThread.has(threadId)) {
        byThread.set(threadId, []);
      }
      byThread.get(threadId)!.push({ commentId: c.commentId, postedAt: c.postedAt });
    }

    const commentsByThread = new Map<string, typeof subscriptionComments>();
    for (const c of subscriptionComments) {
      const threadId = c.topLevelCommentId ?? c.commentId;
      if (!commentsByThread.has(threadId)) {
        commentsByThread.set(threadId, []);
      }
      commentsByThread.get(threadId)!.push(c);
    }

    type FeedItem = { type: SubscribedFeedEntryType; sortDate: Date; data: any };
    const feedItems: FeedItem[] = [];

    for (const row of postRows) {
      const post = row.post;
      if (!post?._id) continue;
      feedItems.push({
        type: 'feedPost',
        sortDate: post.postedAt ?? new Date(),
        data: {
          _id: post._id,
          post,
          postMetaInfo: { servedEventId: randomId(), sources: ['subscriptionsPosts'] },
        },
      });
    }

    function buildPathsForThread(threadId: string) {
      const commentsInThread = commentsByThread.get(threadId) ?? [];
      return buildDistinctLinearThreads(commentsInThread);
    }

    for (const [hourStr, byThread] of targetsByHourAndThread) {
      for (const [threadId, targets] of byThread) {
        const paths = buildPathsForThread(threadId);
        if (paths.length === 0) continue;
        const targetSet = new Set(targets.map(t => t.commentId));
        const selected: string[][] = [];
        const commentsInPaths = paths.map(p => p.map(pc => pc.commentId));

        let remainingTargets = targetSet.size;
        while (remainingTargets > 0) {
          let bestIdx = -1;
          let bestCover = 0;
          for (let i = 0; i < commentsInPaths.length; i++) {
            const covered = commentsInPaths[i].filter(id => targetSet.has(id)).length;
            if (covered > bestCover) {
              bestCover = covered;
              bestIdx = i;
            }
          }
          if (bestIdx === -1 || bestCover === 0) break;
          const chosen = commentsInPaths[bestIdx];
          selected.push(chosen);
          chosen.forEach(id => targetSet.delete(id));
          remainingTargets = targetSet.size;
        }

        for (const pathCommentIds of selected) {
          const loadedComments = filterNonnull(pathCommentIds.map(id => commentsById.get(id)));
          if (loadedComments.length === 0) continue;

          const hourStart = new Date(hourStr);
          const hourEnd = new Date(hourStart.getTime() + (60 * 60 * 1000));
          const targetsInSlice = loadedComments.filter(c => c.postedAt >= hourStart && c.postedAt < hourEnd && c.userId && c.userId !== currentUser._id);
          const latestInSlice = targetsInSlice.reduce<Date | null>((acc, c) => (acc && acc > c.postedAt ? acc : c.postedAt), null);
          const overallLatest = loadedComments.reduce<Date | null>((acc, c) => (acc && acc > c.postedAt ? acc : c.postedAt), null);
          const sortDate = latestInSlice ?? overallLatest ?? loadedComments[loadedComments.length - 1].postedAt;

          const firstComment = loadedComments[0];
          const postId = firstComment.postId;
          const post = postId ? postsById.get(postId) : undefined;

          const commentMetaInfos: { [commentId: string]: any } = {};
          loadedComments.forEach(c => {
            commentMetaInfos[c._id] = {
              sources: ['subscriptionsComments'],
              displayStatus: 'collapsed',
              servedEventId: randomId(),
              postedAt: c.postedAt,
            };
          });

          const threadStableId = generateThreadHash(loadedComments.map(c => c._id));

          feedItems.push({
            type: 'feedCommentThread',
            sortDate,
            data: {
              _id: `${threadStableId}_${hourStr}`,
              comments: loadedComments,
              commentMetaInfos,
              isOnReadPost: false,
              postSources: ['subscriptionsComments'],
              post,
            },
          });
        }
      }
    }

    feedItems.sort((a, b) => (b.sortDate.getTime() - a.sortDate.getTime()) || (a.type < b.type ? -1 : 1));

    const filteredByCutoff = cutoff ? feedItems.filter(fi => fi.sortDate < cutoff) : feedItems;
    
    // Maybe insert subscription suggestions with 20% probability
    const withSuggestions = insertSubscriptionSuggestions(filteredByCutoff, () => ({
      type: 'feedSubscriptionSuggestions' as const,
      sortDate: new Date(),
      data: {}
    }), 0.2, 4);
    
    const pageItems = withSuggestions.slice(offset, offset + limit);
    
    // Load suggested users if we have a suggestions item
    const hasSuggestions = pageItems.some(it => it.type === 'feedSubscriptionSuggestions');
    const suggestedUsers = hasSuggestions ? await getSubscriptionSuggestedUsers(context, currentUser._id, 30) : [];

    const eventsToCreate: UltraFeedEventInsertData[] = [];
    pageItems.forEach((item, index) => {
      const itemIndex = (offset ?? 0) + index;
      if (item.type === 'feedPost') {
        const post = item.data.post as DbPost;
        if (post?._id) {
          const servedEventId = item.data.postMetaInfo?.servedEventId ?? randomId();
          eventsToCreate.push({
            _id: servedEventId,
            userId: currentUser._id,
            eventType: 'served',
            collectionName: 'Posts',
            documentId: post._id,
            event: { feedType: 'subscribedFeed', itemIndex, sources: ['subscriptionsPosts'] },
          });
        }
      } else if (item.type === 'feedCommentThread') {
        const commentsList: DbComment[] = item.data.comments ?? [];
        commentsList.forEach((c: DbComment, commentIndex: number) => {
          const servedEventId = item.data.commentMetaInfos?.[c._id]?.servedEventId ?? randomId();
          eventsToCreate.push({
            _id: servedEventId,
            userId: currentUser._id,
            eventType: 'served',
            collectionName: 'Comments',
            documentId: c._id,
            event: { feedType: 'subscribedFeed', itemIndex, commentIndex, sources: ['subscriptionsComments'] },
          });
        });
      }
    });
    insertUltraFeedEvents(eventsToCreate);

    const results = pageItems.map(item => {
      if (item.type === 'feedPost') {
        return { type: 'feedPost', feedPost: { _id: item.data.post._id, post: item.data.post, postMetaInfo: item.data.postMetaInfo } };
      }
      if (item.type === 'feedCommentThread') {
        return { type: 'feedCommentThread', feedCommentThread: item.data };
      }
      // feedSubscriptionSuggestions
      return { 
        type: 'feedSubscriptionSuggestions', 
        feedSubscriptionSuggestions: { 
          _id: `subscription-suggestions-${offset}`,
          suggestedUsers 
        } 
      };
    });

    const nextCutoff = pageItems.length > 0 ? pageItems[pageItems.length - 1].sortDate : null;

    return createUltraFeedResponse(results, offset ?? 0, null, nextCutoff);
  },
};


