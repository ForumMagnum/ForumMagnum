import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, ensureIndex } from '../../collectionUtils'

export const EmailTokens: EmailTokensCollection = createCollection({
  collectionName: 'EmailTokens',
  typeName: 'EmailTokens',
  schema,
});

addUniversalFields({collection: EmailTokens})
ensureIndex(EmailTokens, { token:1 });

export default EmailTokens;

