import { PermissionableUser, userGetGroups } from '../vulcan-users/permissions';
import Tags from '../collections/tags/collection';
import { PermissionResult } from '../make_voteable';
import { CoauthoredPost, userIsPostCoauthor } from '../collections/posts/helpers';

const FETCH_INTERVAL_MS = 1000 * 60 * 60; // Fetch once per hour

// Map from tag._id to permission groups
let tagVotingGroups: Record<string, string[]> = {};
let lastFetched = 0;

const getTagVotingGroups = async (tagId: string) => {
  if (lastFetched + FETCH_INTERVAL_MS < Date.now()) {
    const results = await Tags.find({canVoteOnRels: {$exists: true}}).fetch();
    tagVotingGroups = results.reduce((groups, {_id, canVoteOnRels}) => {
      groups[_id] = canVoteOnRels;
      return groups;
    }, {});
    lastFetched = Date.now();
  }

  return tagVotingGroups[tagId];
}

export const canVoteOnTag = (
  tagGroups: string[]|null|undefined,
  user: PermissionableUser|DbUser|null,
  post: {userId?: string} & CoauthoredPost|null,
): boolean => {
  if (!tagGroups || !user) {
    return true;
  }
  const userGroups = userGetGroups(user);
  for (const group of tagGroups) {
    if (userGroups.includes(group)) {
      return true;
    }
  }
  if (tagGroups.includes("userOwns") && post) {
    if (user._id === post?.userId || userIsPostCoauthor(user, post)) {
      return true;
    }
  }
  return false;
}

export const userCanVoteOnTag = async (
  user: DbUser,
  tagId: string,
  postId: string,
  context: {Posts: PostsCollection},
): Promise<PermissionResult> => {
  const tagGroups = await getTagVotingGroups(tagId);
  if (!tagGroups) {
    return {fail: false};
  }

  const post = await context.Posts.findOne({_id: postId});
  if (canVoteOnTag(tagGroups, user, post)) {
    return {fail: false};
  }

  return {fail: true, reason: 'You do not have permission to apply or vote on this tag'};
}
