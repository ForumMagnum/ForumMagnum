import schema from "@/lib/collections/postPreviews/newSchema";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";
import { createCollection } from "@/lib/vulcan-lib/collections";

export const PostPreviews = createCollection({
  collectionName: "PostPreviews",
  typeName: "PostPreview",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex(
      "PostPreviews",
      { postId: 1, revisionId: 1, modelId: 1, promptVersion: 1 },
      { unique: true },
    );
    return indexSet;
  },
});

export default PostPreviews;
