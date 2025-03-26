import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const ClientIds: ClientIdsCollection = createCollection({
  collectionName: "ClientIds",
  typeName: "ClientId",
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ClientIds', { clientId: 1 }, { unique: true, concurrently: true, name: "idx_ClientIds_clientId_unique" });
    indexSet.addIndex('ClientIds', { userIds: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('ClientIds'),
});


