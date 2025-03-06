import schema from '@/lib/collections/emailTokens/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { addUniversalFields } from '@/lib/collectionUtils';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const EmailTokens: EmailTokensCollection = createCollection({
  collectionName: 'EmailTokens',
  typeName: 'EmailTokens',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('EmailTokens', { token: 1 });
    return indexSet;
  },
});

addUniversalFields({collection: EmailTokens})

export default EmailTokens;
