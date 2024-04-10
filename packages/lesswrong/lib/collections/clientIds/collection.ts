import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils';
import { ensureIndex } from '../../collectionIndexUtils';
import { registerFragment } from '../../vulcan-lib/fragments';

export const ClientIds: ClientIdsCollection = createCollection({
  collectionName: "ClientIds",
  typeName: "ClientId",
  schema,
  resolvers: getDefaultResolvers('ClientIds'),
});

ClientIds.checkAccess = async (currentUser: DbUser|null, clientId: DbClientId, context: ResolverContext|null): Promise<boolean> => {
  return currentUser?.isAdmin ?? false;
}

addUniversalFields({
  collection: ClientIds,
  createdAtOptions: {canRead: ['admins']},
});

ensureIndex(ClientIds, {clientId: 1});
ensureIndex(ClientIds, {userIds: 1});

registerFragment(`
  fragment ModeratorClientIDInfo on ClientId {
    _id
    clientId
    createdAt
    firstSeenReferrer
    firstSeenLandingPage
    users {
      ...UsersMinimumInfo
    }
  }
`);

declare global {
  interface ClientIdsViewTerms extends ViewTermsBase {
    view?: ClientIdsViewName
    clientId?: string
  }
}

ClientIds.addView("getClientId", (terms: ClientIdsViewTerms) => {
  return {
    selector: {
      clientId: terms.clientId,
    },
  };
});
