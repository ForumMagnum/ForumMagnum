import schema from "./schema";
import { createCollection } from "../../vulcan-lib/collections";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const ForumEvents: ForumEventsCollection = createCollection({
  collectionName: "ForumEvents",
  typeName: "ForumEvent",
  schema,
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
