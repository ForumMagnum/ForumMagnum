import schema from '@/lib/collections/clientIds/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const ClientIds = createCollection({
  collectionName: "ClientIds",
  typeName: "ClientId",
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ClientIds', { clientId: 1 }, { unique: true, concurrently: true, name: "idx_ClientIds_clientId_unique" });
    indexSet.addIndex('ClientIds', { userIds: 1 });
    return indexSet;
  },
});


