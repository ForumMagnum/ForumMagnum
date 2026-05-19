import schema from '@/lib/collections/workspaceRepos/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const WorkspaceRepos: WorkspaceReposCollection = createCollection({
  collectionName: 'WorkspaceRepos',
  typeName: 'WorkspaceRepo',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    // Resolve the current config row for a repo (latest by createdAt in the
    // identity group) and list a user's repos — both off this one index.
    indexSet.addIndex('WorkspaceRepos', { userId: 1, host: 1, owner: 1, name: 1, createdAt: -1 });
    return indexSet;
  },
});


export default WorkspaceRepos;
