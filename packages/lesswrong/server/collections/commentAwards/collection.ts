import { createCollection } from "@/lib/vulcan-lib/collections";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const CommentAwards: CommentAwardsCollection = createCollection({
  collectionName: "CommentAwards",
  typeName: "CommentAward",
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('CommentAwards', {commentId: 1});
    indexSet.addIndex('CommentAwards', {commentId: 1, isDeleted: 1});
    indexSet.addIndex('CommentAwards', {userId: 1});
    indexSet.addIndex('CommentAwards', {userId: 1, isDeleted: 1});
    return indexSet;
  },
});

export default CommentAwards;
