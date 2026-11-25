import schema from "@/lib/collections/aiDigestItemClicks/newSchema";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";
import { createCollection } from "@/lib/vulcan-lib/collections";

export const AiDigestItemClicks = createCollection({
  collectionName: "AiDigestItemClicks",
  typeName: "AiDigestItemClick",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex("AiDigestItemClicks", { issueId: 1, sectionKind: 1, itemIndex: 1 }, { unique: true });
    return indexSet;
  },
});

export default AiDigestItemClicks;
