import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

/**
 * Creating a moderator action sets a note on the user's profile for moderators
 * to see, and triggers a review if necessary.
 *
 * Pass currentUser to createMutator to set the moderator who created the
 * action. Do *not* pass currentUser if the currentUser is the user themselves.
 * Setting currentUser to null (and validate to false) will create the action as
 * 'Automod'.
 */
export const UserRateLimits: UserRateLimitsCollection = createCollection({
  collectionName: 'UserRateLimits',
  typeName: 'UserRateLimit',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('UserRateLimits', { userId: 1, createdAt: -1, endedAt: -1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('UserRateLimits'),
  mutations: getDefaultMutations('UserRateLimits'),
  logChanges: true,
});


export default UserRateLimits;
