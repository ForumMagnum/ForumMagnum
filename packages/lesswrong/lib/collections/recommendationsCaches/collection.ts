import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";
import { createCollection } from "../../vulcan-lib/collections";
import schema from "./schema";

const RecommendationsCaches: RecommendationsCachesCollection = createCollection({
  collectionName: "RecommendationsCaches",
  typeName: "RecommendationsCache",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('RecommendationsCaches', { userId: 1, postId: 1, source: 1, scenario: 1 }, { unique: true });
    return indexSet;
  },
  logChanges: true,
});

export default RecommendationsCaches;
