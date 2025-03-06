import { createCollection } from '@/lib/vulcan-lib/collections';
import schema from '@/lib/collections/votes/schema';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { addUniversalFields } from "@/lib/collectionUtils";
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";

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
