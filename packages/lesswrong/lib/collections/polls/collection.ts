import { userOwns } from '../../vulcan-users/permissions';
import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';

const options: MutationOptions<DbPoll> = {
  newCheck: (user: DbUser|null, document: DbPoll|null) => {
    if (!user || !document) return false;
    return true
  },

  editCheck: (user: DbUser|null, document: DbPoll|null) => {
    if (!user || !document) return false;
    return userOwns(user, document)
  },

  removeCheck: (user: DbUser|null, document: DbPoll|null) => {
    if (!user || !document) return false;
    return userOwns(user, document)
  },
}

export const Polls: PollsCollection = createCollection({
  collectionName: 'Polls',
  typeName: 'Poll',
  schema,
  resolvers: getDefaultResolvers('Polls'),
  mutations: getDefaultMutations('Polls', options),
  logChanges: true,
});


addUniversalFields({collection: Polls})

export default Polls;
