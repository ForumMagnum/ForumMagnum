import { createCollection } from "@/lib/vulcan-lib/collections";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const SideCommentCaches: SideCommentCachesCollection = createCollection({
  collectionName: "SideCommentCaches",
  typeName: "SideCommentCache",
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('SideCommentCaches', {postId: 1});
    indexSet.addIndex('SideCommentCaches', {postId: 1, version: 1}, {unique: true});
    return indexSet;
  },
  resolvers: {},
  mutations: {},
  logChanges: false,
});


export default SideCommentCaches;
