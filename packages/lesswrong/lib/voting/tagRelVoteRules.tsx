import { userGetGroups } from '../vulcan-users/permissions';
import Tags from '../collections/tags/collection';

const FETCH_INTERVAL_MS = 1000 * 60 * 60; // Fetch once per hour

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

export const userCanVoteOnTag = async (user: DbUser, tagId: string) => {
  const groups = await getTagVotingGroups(tagId);
  if (!groups) {
    return true;
  }

  const userGroups = userGetGroups(user);
  for (const group of groups) {
    if (userGroups.includes(group)) {
      return true;
    }
  }

  return false;
}
