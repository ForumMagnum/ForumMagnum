import { getDefaultMutations, getDefaultResolvers } from "../../collectionUtils";
import { createCollection } from "../../vulcan-lib";
import schema from "./schema";

const TagReports = createCollection({
  collectionName: 'TagReports',
  typeName: 'TagReport',
  schema,
  resolvers: getDefaultResolvers('Reports'),
  mutations: getDefaultMutations('Reports'),
  logChanges: true,
});

export default TagReports;
