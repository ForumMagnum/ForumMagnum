import { createCollection } from "@/lib/vulcan-lib/collections";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const ForumEvents: ForumEventsCollection = createCollection({
  collectionName: "ForumEvents",
  typeName: "ForumEvent",
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ForumEvents', {endDate: 1});
    return indexSet;
  },
  resolvers: getDefaultResolvers("ForumEvents"),
  mutations: getDefaultMutations("ForumEvents"),
  logChanges: true,
});


export default ForumEvents;
