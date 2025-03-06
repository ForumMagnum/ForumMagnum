import schema from '@/lib/collections/sessions/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const Sessions: SessionsCollection = createCollection({
  collectionName: 'Sessions',
  dbCollectionName: 'sessions',
  typeName: 'Session',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Sessions', {_id: 1, expires: 1});
    indexSet.addIndex('Sessions', {expires: 1});
    return indexSet;
  },
  logChanges: false,
});

Sessions.checkAccess = async (
  _user: DbUser|null,
  _session: DbSession,
  _context: ResolverContext|null,
  outReasonDenied: {reason?: string},
): Promise<boolean> => {
  outReasonDenied.reason = "Sessions cannot be accessed manually";
  return false;
}

export default Sessions;
