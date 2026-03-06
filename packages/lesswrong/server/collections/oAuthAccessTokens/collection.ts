import schema from '@/lib/collections/oAuthAccessTokens/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const OAuthAccessTokens: OAuthAccessTokensCollection = createCollection({
  collectionName: 'OAuthAccessTokens',
  typeName: 'OAuthAccessToken',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex("OAuthAccessTokens", { hashedToken: 1 }, { unique: true });
    indexSet.addIndex("OAuthAccessTokens", { userId: 1 });
    indexSet.addIndex("OAuthAccessTokens", { expiresAt: 1 });
    return indexSet;
  },
});


export default OAuthAccessTokens;
