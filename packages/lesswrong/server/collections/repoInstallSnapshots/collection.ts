import schema from '@/lib/collections/repoInstallSnapshots/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const RepoInstallSnapshots: RepoInstallSnapshotsCollection = createCollection({
  collectionName: 'RepoInstallSnapshots',
  typeName: 'RepoInstallSnapshot',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex(
      'RepoInstallSnapshots',
      { workspaceRepoId: 1, manifestHash: 1 },
      { unique: true },
    );
    return indexSet;
  },
});


export default RepoInstallSnapshots;
