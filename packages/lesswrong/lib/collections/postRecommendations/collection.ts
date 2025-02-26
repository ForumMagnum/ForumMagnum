import { createCollection } from "../../vulcan-lib/collections";
import { addUniversalFields } from "../../collectionUtils"
import { schema } from "./schema";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const PostRecommendations: PostRecommendationsCollection = createCollection({
  collectionName: "PostRecommendations",
  typeName: "PostRecommendation",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('PostRecommendations', { userId: 1, clientId: 1, postId: 1 }, { unique: true });
    return indexSet;
  },
  dependencies: [
    {type: "extension", name: "vector"},
    {type: "extension", name: "intarray"},
  ],
});
addUniversalFields({collection: PostRecommendations});


export default PostRecommendations;
