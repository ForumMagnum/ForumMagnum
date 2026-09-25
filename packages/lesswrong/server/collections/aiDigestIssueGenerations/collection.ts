import schema from "@/lib/collections/aiDigestIssueGenerations/newSchema";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";
import { createCollection } from "@/lib/vulcan-lib/collections";

export const AiDigestIssueGenerations = createCollection({
  collectionName: "AiDigestIssueGenerations",
  typeName: "AiDigestIssueGeneration",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex("AiDigestIssueGenerations", { issueId: 1 }, { unique: true });
    return indexSet;
  },
});

export default AiDigestIssueGenerations;
