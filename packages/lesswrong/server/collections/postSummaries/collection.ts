import schema from "@/lib/collections/postSummaries/newSchema";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";
import { createCollection } from "@/lib/vulcan-lib/collections";

export const PostSummaries = createCollection({
  collectionName: "PostSummaries",
  typeName: "PostSummary",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex(
      "PostSummaries",
      { postId: 1, revisionId: 1, modelId: 1, promptVersion: 1 },
      { unique: true },
    );
    return indexSet;
  },
});

export default PostSummaries;
