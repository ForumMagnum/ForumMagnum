import { createCollection } from "../../vulcan-lib";
import { addUniversalFields } from "../../collectionUtils"
import schema from "./schema";

export const RevisionExcerpts: RevisionExcerptsCollection = createCollection({
  collectionName: "RevisionExcerpts",
  typeName: "RevisionExcerpt",
  schema,
  resolvers: {},
  mutations: {},
  logChanges: false,
});

addUniversalFields({collection: RevisionExcerpts});

export default RevisionExcerpts;
