import schema from "@/lib/collections/aiDigestIssues/newSchema";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";
import { createCollection } from "@/lib/vulcan-lib/collections";

export const AiDigestIssues = createCollection({
  collectionName: "AiDigestIssues",
  typeName: "AiDigestIssue",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex("AiDigestIssues", { recipientId: 1, generatedAt: -1 });
    return indexSet;
  },
});

export default AiDigestIssues;
