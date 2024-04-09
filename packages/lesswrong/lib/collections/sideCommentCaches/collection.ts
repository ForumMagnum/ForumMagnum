import { createCollection } from "../../vulcan-lib";
import { addUniversalFields, getDefaultResolvers } from "../../collectionUtils"
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
import { ensureIndex } from "../../collectionIndexUtils";
import schema from "./schema";

export const SideCommentCaches: SideCommentCachesCollection = createCollection({
  collectionName: "SideCommentCaches",
  typeName: "SideCommentCache",
  schema,
  resolvers: getDefaultResolvers("SideCommentCaches"),
  mutations: getDefaultMutations("SideCommentCaches"),
  logChanges: false,
});

addUniversalFields({collection: SideCommentCaches});

ensureIndex(SideCommentCaches, {postId: 1});
ensureIndex(SideCommentCaches, {postId: 1, version: 1}, {unique: true});

export default SideCommentCaches;
