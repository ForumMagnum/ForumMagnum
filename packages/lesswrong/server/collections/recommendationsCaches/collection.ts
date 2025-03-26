import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";
import { createCollection } from "@/lib/vulcan-lib/collections";

export const RecommendationsCaches: RecommendationsCachesCollection = createCollection({
  collectionName: "RecommendationsCaches",
  typeName: "RecommendationsCache",
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('RecommendationsCaches', { userId: 1, postId: 1, source: 1, scenario: 1 }, { unique: true });
    return indexSet;
  },
  logChanges: true,
});


export default RecommendationsCaches;
