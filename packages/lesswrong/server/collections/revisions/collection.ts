import schema from '@/lib/collections/revisions/schema';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { createCollection } from "@/lib/vulcan-lib/collections";
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getVoteGraphql } from '@/server/votingGraphQL';
export const Revisions: RevisionsCollection = createCollection({
  collectionName: 'Revisions',
  typeName: 'Revision',
  schema,
  resolvers: getDefaultResolvers('Revisions'),
  // This has mutators because of a few mutable metadata fields (eg
  // skipAttributions), but most parts of revisions are create-only immutable.
  mutations: getDefaultMutations('Revisions', {
    create: false ,update: true, upsert: false, delete: false,
    editCheck: (user: DbUser|null) => {
      return userIsAdminOrMod(user);
    }
  }),
  logChanges: true,
  voteable: {
    timeDecayScoresCronjob: false,
  },
});

export interface ChangeMetrics {
  added: number
  removed: number
}

export const { graphqlVoteTypeDefs, graphqlVoteMutations } = getVoteGraphql('Revisions');

export default Revisions;
