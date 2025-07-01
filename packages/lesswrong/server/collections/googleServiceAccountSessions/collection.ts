import schema from '@/lib/collections/googleServiceAccountSessions/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';


export const GoogleServiceAccountSessions = createCollection({
  collectionName: 'GoogleServiceAccountSessions',
  typeName: 'GoogleServiceAccountSession',
  schema,
});


export default GoogleServiceAccountSessions;
