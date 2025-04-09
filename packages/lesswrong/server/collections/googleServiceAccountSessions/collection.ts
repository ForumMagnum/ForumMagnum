import { createCollection } from '@/lib/vulcan-lib/collections';


export const GoogleServiceAccountSessions: GoogleServiceAccountSessionsCollection = createCollection({
  collectionName: 'GoogleServiceAccountSessions',
  typeName: 'GoogleServiceAccountSession',
  logChanges: false,
});


export default GoogleServiceAccountSessions;
