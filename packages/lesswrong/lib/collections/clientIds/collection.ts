import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { registerFragment } from '../../vulcan-lib/fragments';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';
import { CollectionViewSet } from '@/lib/views/collectionViewSet';

export const ClientIds: ClientIdsCollection = createCollection({
  collectionName: "ClientIds",
  typeName: "ClientId",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ClientIds', { clientId: 1 }, { unique: true, concurrently: true, name: "idx_ClientIds_clientId_unique" });
    indexSet.addIndex('ClientIds', { userIds: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('ClientIds'),
});

ClientIds.checkAccess = async (currentUser: DbUser|null, clientId: DbClientId, context: ResolverContext|null): Promise<boolean> => {
  return currentUser?.isAdmin ?? false;
}

addUniversalFields({
  collection: ClientIds,
  createdAtOptions: {canRead: ['admins']},
});


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

function getClientId(terms: ClientIdsViewTerms) {
  return {
    selector: {
      clientId: terms.clientId,
    },
  };
}

export const ClientIdsViews = new CollectionViewSet('ClientIds', { getClientId });
