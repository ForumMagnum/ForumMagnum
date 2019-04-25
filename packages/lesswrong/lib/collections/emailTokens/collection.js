import schema from './schema.js';
import { createCollection } from 'meteor/vulcan:core';
import { addUniversalFields } from '../../collectionUtils'
import { ensureIndex } from '../../collectionUtils';

export const EmailTokens = createCollection({
  collectionName: 'EmailTokens',
  typeName: 'EmailTokens',
  schema,
});

addUniversalFields({collection: EmailTokens})
ensureIndex(EmailTokens, { token:1 });

export default EmailTokens;

