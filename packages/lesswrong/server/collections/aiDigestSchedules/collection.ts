import schema from "@/lib/collections/aiDigestSchedules/newSchema";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";
import { createCollection } from "@/lib/vulcan-lib/collections";

export const AiDigestSchedules = createCollection({
  collectionName: "AiDigestSchedules",
  typeName: "AiDigestSchedule",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex("AiDigestSchedules", { userId: 1 }, { unique: true });
    return indexSet;
  },
});

export default AiDigestSchedules;
