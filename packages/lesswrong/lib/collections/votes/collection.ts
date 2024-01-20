import { createCollection } from '../../vulcan-lib';
import schema from './schema';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { userIsAdminOrMod } from '../../vulcan-users/permissions';

export const Votes: VotesCollection = createCollection({
  collectionName: 'Votes',
  typeName: 'Vote',
  schema,
  resolvers: getDefaultResolvers('Votes'),
});

Votes.checkAccess = async (currentUser: DbUser|null, vote: DbVote, context: ResolverContext|null, outReasonDenied: {reason?: string}): Promise<boolean> => {
  if (!currentUser) return false;
  return (vote.userId===currentUser._id || userIsAdminOrMod(currentUser));
}

addUniversalFields({collection: Votes})

export default Votes;
