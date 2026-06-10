import schema from "@/lib/collections/userBlocks/newSchema";
import { createCollection } from "@/lib/vulcan-lib/collections";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const UserBlocks = createCollection({
  collectionName: "UserBlocks",
  typeName: "UserBlock",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex("UserBlocks", { userId: 1, blockedUserId: 1 }, { unique: true });
    indexSet.addIndex("UserBlocks", { blockedUserId: 1, blocked: 1 });
    return indexSet;
  },
});

export default UserBlocks;
