import { PermissionableUser, userGetGroups } from '../vulcan-users/permissions';
import type { PermissionResult } from '../make_voteable';
import { CoauthoredPost, userIsPostCoauthor } from '../collections/posts/helpers';
import { taggingNameSetting } from '../instanceSettings';

const FETCH_INTERVAL_MS = 1000 * 60 * 60; // Fetch once per hour

// Map from tag._id to permission groups
let tagVotingGroups: Record<string, string[]> = {};
let lastFetched = 0;
let refetchTagVotingGroupsPromise: Promise<void>|null = null;

async function refetchTagVotingGroups(context: ResolverContext) {
  const results = await context.Tags.find({canVoteOnRels: {$exists: true}}).fetch();
  tagVotingGroups = results.reduce((groups: AnyBecauseTodo, {_id, canVoteOnRels}) => {
    groups[_id] = canVoteOnRels;
    return groups;
  }, {});
  lastFetched = Date.now();
}

const getTagVotingGroups = async (tagId: string, context: ResolverContext) => {
  if (lastFetched + FETCH_INTERVAL_MS < Date.now()) {
    // If it's been too long since we refreshed tagVotingGroups, do so. Share
    // the promise so that when this expires (and during startup), we only fetch
    // it once rather than setting off a thundering herd.
    if (!refetchTagVotingGroupsPromise) {
      refetchTagVotingGroupsPromise = refetchTagVotingGroups(context);
    }
    await refetchTagVotingGroupsPromise;
    refetchTagVotingGroupsPromise = null;
  }

  return tagVotingGroups[tagId];
}

export const canVoteOnTag = (
  tagGroups: string[]|null|undefined,
  user: PermissionableUser|DbUser|null,
  post: {userId?: string} & CoauthoredPost|null,
  voteType: string,
): PermissionResult => {
  // If the tag has no voting groups, then anyone can vote on it
  // If the user isn't logged in, then they "can vote on it", aka they get the
  // chance to get prompted to log in
  if (!tagGroups || !user) {
    return {fail: false};
  }
  const userGroups = userGetGroups(user);
  for (const group of tagGroups) {
    if (userGroups.includes(group)) {
      return {fail: false};
    }
  }
  if (!post) {
    return {fail: true, reason: 'Could not find post'};
  }
  const isAuthor = user._id === post?.userId || userIsPostCoauthor(user, post);
  if (tagGroups.includes("userOwns")) {
    if (isAuthor) {
      return {fail: false};
    }
  }
  if (tagGroups.includes("userOwnsOnlyUpvote") && isAuthor) {
    if (["smallUpvote", "bigUpvote", "neutral"].includes(voteType)) {
      return {fail: false};
    } else {
      return {fail: true, reason: `You cannot downvote the relevance of this ${taggingNameSetting.get()}`}
    }
  }
  return {fail: true, reason: `You do not have permission to apply or vote on this ${taggingNameSetting.get()}`};
}

export const canVoteOnTagAsync = async (
  user: DbUser,
  tagId: string,
  postId: string,
  context: ResolverContext,
  voteType: string,
): Promise<PermissionResult> => {
  const tagGroups = await getTagVotingGroups(tagId, context);
  if (!tagGroups) {
    return {fail: false};
  }

  const post = await context.Posts.findOne({_id: postId});
  return canVoteOnTag(tagGroups, user, post, voteType);
}
