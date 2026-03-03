import schema from '@/lib/collections/oAuthClients/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const OAuthClients: OAuthClientsCollection = createCollection({
  collectionName: 'OAuthClients',
  typeName: 'OAuthClient',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    return indexSet;
  },
});


export default OAuthClients;
