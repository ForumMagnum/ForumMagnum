import { addUniversalFields, getDefaultMutations, getDefaultResolvers } from "@/lib/collectionUtils";
import { createCollection } from "@/lib/vulcan-lib";
import schema from "./schema";

const DoppelComments: DoppelCommentsCollection = createCollection({
  collectionName: "DoppelComments",
  typeName: "DoppelComment",
  schema,
  logChanges: true,
  resolvers: getDefaultResolvers('DoppelComments'),
  mutations: getDefaultMutations('DoppelComments', {
    newCheck: (user, document) => {
      return false
    },
    removeCheck: (user, document) => {
      return false
    }
  }),
});

addUniversalFields({
  collection: DoppelComments,
});

export default DoppelComments;
