import { userOwns } from '../../vulcan-users/permissions';
import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';

const options: MutationOptions<DbPollResponse> = {
  newCheck: (user: DbUser|null, document: DbPollResponse|null) => {
    if (!user || !document) return false;
    return true
  },

  editCheck: (user: DbUser|null, document: DbPollResponse|null) => {
    if (!user || !document) return false;
    return userOwns(user, document)
  },

  removeCheck: (user: DbUser|null, document: DbPollResponse|null) => {
    if (!user || !document) return false;
    return userOwns(user, document)
  },
}

export const PollResponses: PollResponsesCollection = createCollection({
  collectionName: 'PollResponses',
  typeName: 'PollResponse',
  schema,
  resolvers: getDefaultResolvers('PollResponses'),
  mutations: getDefaultMutations('PollResponses', options),
  logChanges: true,
});


addUniversalFields({collection: PollResponses})

export default PollResponses;
