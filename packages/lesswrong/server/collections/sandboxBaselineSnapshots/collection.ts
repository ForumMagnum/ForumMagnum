import schema from '@/lib/collections/sandboxBaselineSnapshots/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const SandboxBaselineSnapshots: SandboxBaselineSnapshotsCollection = createCollection({
  collectionName: 'SandboxBaselineSnapshots',
  typeName: 'SandboxBaselineSnapshot',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    // One baseline per runtime.
    indexSet.addIndex('SandboxBaselineSnapshots', { runtime: 1 }, { unique: true });
    return indexSet;
  },
});


export default SandboxBaselineSnapshots;
