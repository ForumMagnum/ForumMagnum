import schema from '@/lib/collections/emailTokens/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const EmailTokens = createCollection({
  collectionName: 'EmailTokens',
  typeName: 'EmailTokens',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('EmailTokens', { token: 1 });
    return indexSet;
  },
});


export default EmailTokens;
