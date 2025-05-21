import { createCollection } from "@/lib/vulcan-lib/collections";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const PostEmbeddings: PostEmbeddingsCollection = createCollection({
  collectionName: "PostEmbeddings",
  typeName: "PostEmbedding",
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('PostEmbeddings', { postId: 1, model: 1 }, { unique: true });
    return indexSet;
  },
});


export default PostEmbeddings;
