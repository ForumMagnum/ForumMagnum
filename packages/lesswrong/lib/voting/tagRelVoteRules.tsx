import { PermissionableUser, userGetGroups, userIsAdminOrMod } from '../vulcan-users/permissions';
import type { PermissionResult } from '../make_voteable';
import { CoauthoredPost, userIsPostCoauthor } from '../collections/posts/helpers';

const FETCH_INTERVAL_MS = 1000 * 60 * 60; // Fetch once per hour

interface TagVoteRules {
  canVoteOnRels?: string[] | null;
  authorOnly?: boolean;
}

// Map from tag._id to voting restrictions
let tagVoteRulesById: Record<string, TagVoteRules> = {};
let lastFetched = 0;
let refetchTagVotingGroupsPromise: Promise<void>|null = null;

async function refetchTagVotingGroups(context: ResolverContext) {
  const results = await context.Tags.find({
    $or: [
      { canVoteOnRels: { $exists: true } },
      { authorOnly: true },
    ],
  }).fetch();
  tagVoteRulesById = results.reduce((rulesById: AnyBecauseTodo, { _id, canVoteOnRels, authorOnly }) => {
    rulesById[_id] = {
      canVoteOnRels,
      authorOnly: authorOnly ?? false,
    };
    return rulesById;
  }, {});
  lastFetched = Date.now();
}

const getTagVoteRules = async (tagId: string, context: ResolverContext): Promise<TagVoteRules | undefined> => {
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

  return tagVoteRulesById[tagId];
}

export const canVoteOnTag = (
  tagGroups: string[]|null|undefined,
  authorOnly: boolean,
  user: PermissionableUser|DbUser|null,
  post: {userId?: string|null} & CoauthoredPost|null,
  voteType: string,
): PermissionResult => {
  // If the user isn't logged in, then they "can vote on it", aka they get the
  // chance to get prompted to log in.
  if (!user) {
    return {fail: false};
  }

  if (authorOnly) {
    if (!post) {
      return { fail: true, reason: "Could not find post" };
    }
    const isAuthor = user._id === post.userId || userIsPostCoauthor(user, post);
    if (isAuthor || userIsAdminOrMod(user)) {
      return { fail: false };
    }
    return { fail: true, reason: `Only the post author and moderators can apply or vote on this wikitag` };
  }

  // If the tag has no voting groups, then anyone can vote on it.
  if (!tagGroups) {
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
      return {fail: true, reason: `You cannot downvote the relevance of this wikitag`}
    }
  }
  return {fail: true, reason: `You do not have permission to apply or vote on this wikitag`};
}

export const canVoteOnTagAsync = async (
  user: DbUser,
  tagId: string,
  postId: string,
  context: ResolverContext,
  voteType: string,
): Promise<PermissionResult> => {
  const tagVoteRules = await getTagVoteRules(tagId, context);
  if (!tagVoteRules) {
    return {fail: false};
  }

  const post = await context.Posts.findOne({_id: postId});
  return canVoteOnTag(tagVoteRules.canVoteOnRels, tagVoteRules.authorOnly ?? false, user, post, voteType);
}
