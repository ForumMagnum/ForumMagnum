import { createCollection } from "../../vulcan-lib/collections";
import { addUniversalFields } from "../../collectionUtils"
import { ensureIndex } from "../../collectionIndexUtils";
import { schema } from "./schema";

export const PostRecommendations: PostRecommendationsCollection = createCollection({
  collectionName: "PostRecommendations",
  typeName: "PostRecommendation",
  schema,
  dependencies: [
    {type: "extension", name: "vector"},
    {type: "extension", name: "intarray"},
  ],
});
addUniversalFields({collection: PostRecommendations});

ensureIndex(PostRecommendations, {userId: 1, clientId: 1, postId: 1}, {unique: true});

export default PostRecommendations;
