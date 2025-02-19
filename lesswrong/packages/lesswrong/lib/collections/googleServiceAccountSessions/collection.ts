import { userIsAdmin } from '../../vulcan-users/permissions';
import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';

const options: MutationOptions<DbGoogleServiceAccountSession> = {
  newCheck: (user: DbUser|null, document: DbGoogleServiceAccountSession|null) => {
    if (!user || !document) return false;
    return userIsAdmin(user)
  },
  editCheck: (user: DbUser|null, document: DbGoogleServiceAccountSession|null) => {
    if (!user || !document) return false;
    return userIsAdmin(user)
  },
  removeCheck: (user: DbUser|null, document: DbGoogleServiceAccountSession|null) => {
    if (!user || !document) return false;
    return userIsAdmin(user)
  },
}

export const GoogleServiceAccountSessions: GoogleServiceAccountSessionsCollection = createCollection({
  collectionName: 'GoogleServiceAccountSessions',
  typeName: 'GoogleServiceAccountSession',
  schema,
  resolvers: getDefaultResolvers('GoogleServiceAccountSessions'),
  mutations: getDefaultMutations('GoogleServiceAccountSessions', options),
  logChanges: false,
});

addUniversalFields({collection: GoogleServiceAccountSessions})

export default GoogleServiceAccountSessions;
