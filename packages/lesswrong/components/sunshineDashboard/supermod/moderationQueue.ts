import countBy from 'lodash/countBy';
import type { ModerationInboxQueueQueryQuery } from '@/lib/generated/gql-codegen/graphql';
import type { TabId } from './groupings';

export type UnloadedCounts = Partial<Record<TabId, number>>;

export interface ModerationQueueSnapshot {
  users: SunshineUsersList[];
  posts: SunshinePostsList[];
  classifiedPosts: SunshinePostsList[];
  // Retained by the reducer after moderation removes items from the visible lists.
  loadedUserIds: string[];
  loadedPostIds: string[];
  unloadedCounts: UnloadedCounts;
}

export function getModerationQueueSnapshot(
  data: ModerationInboxQueueQueryQuery,
  directUser: SunshineUsersList | null = null,
): ModerationQueueSnapshot {
  const fetchedUsers = data.users?.results ?? [];
  const fetchedPosts = data.posts?.results ?? [];
  const classifiedPosts = data.classifiedPosts?.results ?? [];
  const loadedUserIds = new Set(fetchedUsers.map(user => user._id));
  const users = fetchedUsers.filter(user => user.needsReview);
  if (directUser && !users.some(user => user._id === directUser._id)) {
    users.unshift(directUser);
    loadedUserIds.add(directUser._id);
  }
  const unloadedUsers = data.reviewQueueUsers?.results.filter(user => !loadedUserIds.has(user._id)) ?? [];

  return {
    users,
    posts: fetchedPosts.filter(post => !post.reviewedByUserId),
    classifiedPosts,
    // Keep fetched IDs even when an item was moderated while this request was running.
    loadedUserIds: [...loadedUserIds],
    loadedPostIds: [...new Set([...fetchedPosts, ...classifiedPosts].map(post => post._id))],
    unloadedCounts: {
      ...countBy(unloadedUsers, user => user.reviewGroup ?? 'unknown'),
      all: unloadedUsers.length,
      posts: Math.max(0, (data.posts?.totalCount ?? 0) - fetchedPosts.length),
      classifiedPosts: Math.max(0, (data.classifiedPosts?.totalCount ?? 0) - classifiedPosts.length),
    },
  };
}
