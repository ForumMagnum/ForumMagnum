import schema from '@/lib/collections/postEmbeddings/newSchema';
import { createCollection } from "@/lib/vulcan-lib/collections";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const PostEmbeddings = createCollection({
  collectionName: "PostEmbeddings",
  typeName: "PostEmbedding",
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('PostEmbeddings', { postId: 1, model: 1 }, { unique: true });
    return indexSet;
  },
});


export default PostEmbeddings;
