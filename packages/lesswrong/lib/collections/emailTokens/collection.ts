import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils';
import { ensureIndex } from '../../collectionIndexUtils'
import { forumTypeSetting } from '../../instanceSettings';

export const EmailTokens: EmailTokensCollection = createCollection({
  collectionName: 'EmailTokens',
  typeName: 'EmailTokens',
  collectionType: forumTypeSetting.get() === 'EAForum' ? 'pg' : 'mongo',
  schema,
});

addUniversalFields({collection: EmailTokens})
ensureIndex(EmailTokens, { token:1 });

export default EmailTokens;
