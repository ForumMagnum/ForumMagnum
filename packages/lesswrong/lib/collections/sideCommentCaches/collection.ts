import { createCollection } from "../../vulcan-lib/collections";
import schema from "./schema";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const SideCommentCaches: SideCommentCachesCollection = createCollection({
  collectionName: "SideCommentCaches",
  typeName: "SideCommentCache",
  schema,
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
