import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'
import { ensureIndex } from '../../collectionIndexUtils';

export const CurationEmails: CurationEmailsCollection = createCollection({
  collectionName: 'CurationEmails',
  typeName: 'CurationEmail',
  schema,
  logChanges: true,
});

addUniversalFields({ collection: CurationEmails });

ensureIndex(CurationEmails, { userId: 1 }, { unique: true });

export default CurationEmails;
