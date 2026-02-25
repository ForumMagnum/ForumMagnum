import schema from '@/lib/collections/oAuthAuthorizationCodes/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const OAuthAuthorizationCodes: OAuthAuthorizationCodesCollection = createCollection({
  collectionName: 'OAuthAuthorizationCodes',
  typeName: 'OAuthAuthorizationCode',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex("OAuthAuthorizationCodes", { hashedCode: 1 }, { unique: true });
    indexSet.addIndex("OAuthAuthorizationCodes", { expiresAt: 1 });
    return indexSet;
  },
});


export default OAuthAuthorizationCodes;
