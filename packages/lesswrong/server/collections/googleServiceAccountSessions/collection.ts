import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";


export const GoogleServiceAccountSessions: GoogleServiceAccountSessionsCollection = createCollection({
  collectionName: 'GoogleServiceAccountSessions',
  typeName: 'GoogleServiceAccountSession',
    resolvers: getDefaultResolvers('GoogleServiceAccountSessions'),
  logChanges: false,
});


export default GoogleServiceAccountSessions;
