import schema from "@/lib/collections/forumEvents/schema";
import { createCollection } from "@/lib/vulcan-lib/collections";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { addUniversalFields } from "@/lib/collectionUtils";
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
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

addUniversalFields({collection: ForumEvents});

export default ForumEvents;
