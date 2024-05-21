import { createCollection } from "../../vulcan-lib";
import { addUniversalFields, getDefaultResolvers } from "../../collectionUtils"
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
import schema from "./schema";
import { ensureIndex } from "../../collectionIndexUtils";

export const PostEmbeddings: PostEmbeddingsCollection = createCollection({
  collectionName: "PostEmbeddings",
  typeName: "PostEmbedding",
  schema,
  resolvers: getDefaultResolvers("PostEmbeddings"),
  mutations: getDefaultMutations("PostEmbeddings"),
  logChanges: false,
});

addUniversalFields({collection: PostEmbeddings});

ensureIndex(PostEmbeddings, {postId: 1, model: 1}, {unique: true});

export default PostEmbeddings;
