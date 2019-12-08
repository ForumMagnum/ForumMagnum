import schema from './schema.js';
import { createCollection } from 'meteor/vulcan:core';
import { addUniversalFields, ensureIndex } from '../../collectionUtils'

export const EmailTokens = createCollection({
  collectionName: 'EmailTokens',
  typeName: 'EmailTokens',
  schema,
});

addUniversalFields({collection: EmailTokens})
ensureIndex(EmailTokens, { token:1 });

export default EmailTokens;

