import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { addUniversalFields } from '../../collectionUtils';
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
