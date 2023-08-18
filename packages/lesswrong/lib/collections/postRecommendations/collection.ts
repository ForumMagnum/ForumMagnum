import { createCollection } from "../../vulcan-lib";
import { addUniversalFields } from "../../collectionUtils"
import { isEAForum } from "../../instanceSettings";
import { ensureIndex } from "../../collectionIndexUtils";
import { schema } from "./schema";

export const PostRecommendations: PostRecommendationsCollection = createCollection({
  collectionName: "PostRecommendations",
  typeName: "PostRecommendation",
  collectionType: "pg",
  schema,
});
addUniversalFields({collection: PostRecommendations});

ensureIndex(PostRecommendations, {userId: 1, clientId: 1, postId: 1}, {unique: true});

export default PostRecommendations;
