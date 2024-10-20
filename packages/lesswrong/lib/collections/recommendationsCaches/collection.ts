import { ensureIndex } from "../../collectionIndexUtils";
import { addUniversalFields } from "../../collectionUtils";
import { createCollection } from "../../vulcan-lib";
import schema from "./schema";

const RecommendationsCaches: RecommendationsCachesCollection = createCollection({
  collectionName: "RecommendationsCaches",
  typeName: "RecommendationsCache",
  schema,
  logChanges: true,
});

addUniversalFields({
  collection: RecommendationsCaches,
});

ensureIndex(RecommendationsCaches, { userId: 1, postId: 1, source: 1, scenario: 1 }, { unique: true });

export default RecommendationsCaches;
