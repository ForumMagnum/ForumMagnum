import gql from 'graphql-tag';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import { randomId } from '@/lib/random';
import { buildDistinctLinearThreads, generateThreadHash } from '@/server/ultraFeed/ultraFeedThreadHelpers';
import { FilterSettings } from '@/lib/filterSettings';
import { FeedPostMetaInfo, FeedCommentMetaInfo } from '@/components/ultraFeed/ultraFeedTypes';
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
      offset: Int,
      settings: JSON
    ): UltraFeedQueryResults!
  }
`;

interface UltraFeedSubscriptionsArgs {
  limit?: number;
  cutoff?: Date | null;
  offset?: number;
  settings?: any;
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
    const hideRead = !!(args.settings?.subscriptionsFeedSettings?.hideRead);

    const postsRepo = context.repos.posts;
    const commentsRepo = context.repos.comments;

    const subscribedPostFilterSettings: FilterSettings = {
      tags: [],
      personalBlog: 'Default',
    };

    const postRows = await postsRepo.getLatestAndSubscribedFeedPosts(
      context,
      {
        filterSettings: subscribedPostFilterSettings,
        maxAgeDays: 60,
        limit: 1000,
        restrictToFollowedAuthors: true,
        filterOutReadOrViewed: false,
      }
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
    const commentDataById = new Map<string, typeof subscriptionComments[number]>(
      subscriptionComments.map(c => [c.commentId, c])
    );

    const { postsById, commentsById } = await loadMultipleEntitiesById(context, {
      posts: allPostIds,
      comments: commentIds
    });

    // Get read statuses for all posts that appear in comment threads
    const postReadStatuses = await postsRepo.getPostReadStatuses(postIdsFromComments, currentUser?._id ?? null);

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

    type FeedItem = { 
      type: SubscribedFeedEntryType; 
      sortDate: Date; 
      data: {
        _id: string;
        post?: DbPost | null;
        postMetaInfo?: FeedPostMetaInfo;
        comments?: DbComment[];
        commentMetaInfos?: Record<string, FeedCommentMetaInfo>;
        isOnReadPost?: boolean;
        postSources?: string[];
        users?: DbUser[];
      };
    };
    const feedItems: FeedItem[] = [];

    for (const row of postRows) {
      const post = row.post;
      if (!post?._id) continue;
      if (hideRead && (row.postMetaInfo?.lastViewed || row.postMetaInfo?.lastInteracted)) {
        continue;
      }
      feedItems.push({
        type: 'feedPost',
        sortDate: post.postedAt ?? new Date(),
        data: {
          _id: post._id,
          post: post as DbPost,
          postMetaInfo: { 
            servedEventId: randomId(), 
            sources: ['subscriptionsPosts'] as const,
            lastViewed: row.postMetaInfo?.lastViewed ?? null,
            lastInteracted: row.postMetaInfo?.lastInteracted ?? null,
            highlight: !(row.postMetaInfo?.lastViewed || row.postMetaInfo?.lastInteracted),
            displayStatus: 'expanded' as const,
            isRead: !!(row.postMetaInfo?.lastViewed || row.postMetaInfo?.lastInteracted),
          },
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

          const commentMetaInfos: Record<string, FeedCommentMetaInfo> = {};
          loadedComments.forEach(c => {
            const src = commentDataById.get(c._id);
            commentMetaInfos[c._id] = {
              sources: ['subscriptionsComments'] as const,
              displayStatus: 'expanded' as const,
              servedEventId: randomId(),
              postedAt: c.postedAt,
              descendentCount: c.descendentCount ?? 0,
              directDescendentCount: 0,
              highlight: !(src?.lastViewed || src?.lastInteracted),
              lastServed: null,
              lastViewed: src?.lastViewed ?? null,
              lastInteracted: src?.lastInteracted ?? null,
              fromSubscribedUser: !!src?.fromSubscribedUser,
            };
          });

          const threadStableId = generateThreadHash(loadedComments.map(c => c._id));

          // If hideRead is enabled, skip threads where all comments by subscribed authors are read
          if (hideRead) {
            const allCommentsRead = loadedComments
              .filter((c: DbComment) => commentDataById.get(c._id)?.fromSubscribedUser)
              .every((c: DbComment) => {
                const { fromSubscribedUser, lastViewed, lastInteracted } = commentDataById.get(c._id) ?? {};

                return fromSubscribedUser && (!!(lastViewed || lastInteracted));
              });
            if (allCommentsRead) {
              continue;
            }
          }

          const isOnReadPost = postId ? (postReadStatuses.get(postId) ?? false) : false;

          feedItems.push({
            type: 'feedCommentThread',
            sortDate,
            data: {
              _id: `${threadStableId}_${hourStr}`,
              comments: loadedComments,
              commentMetaInfos,
              isOnReadPost,
              postSources: ['subscriptionsComments'],
              post,
            },
          });
        }
      }
    }

    feedItems.sort((a, b) => (b.sortDate.getTime() - a.sortDate.getTime()) || (a.type < b.type ? -1 : 1));

    // Use offset-based pagination (ignore cutoff) to align with main feed behavior
    const pageStart = offset ?? 0;
    const pageEnd = pageStart + (limit ?? 20);
    const pageCore = feedItems.slice(pageStart, pageEnd);
    const pageItems: typeof feedItems = [];
    // Insert a suggestions entry after every 40 feed items
    for (let i = 0; i < pageCore.length; i++) {
      pageItems.push(pageCore[i]);
      const globalIndex = pageStart + i + 1;
      if (globalIndex % 40 === 0) {
        pageItems.push({
          type: 'feedSubscriptionSuggestions',
          sortDate: new Date(),
          data: { _id: randomId() }
        });
      }
    }
    
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
            event: { feedType: 'following', itemIndex, sources: ['subscriptionsPosts'] },
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
            event: { feedType: 'following', itemIndex, commentIndex, sources: ['subscriptionsComments'] },
          });
        });
      }
    });
    insertUltraFeedEvents(eventsToCreate);

    const results = pageItems.map(item => {
      if (item.type === 'feedPost' && item.data.post) {
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


