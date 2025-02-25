import { createCollection } from '../../vulcan-lib/collections';
import schema from './schema';
import { userIsAdminOrMod } from '../../vulcan-users/permissions';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

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
