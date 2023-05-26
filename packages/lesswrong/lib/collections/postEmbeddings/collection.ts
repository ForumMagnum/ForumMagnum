import { createCollection } from "../../vulcan-lib";
import { addUniversalFields, getDefaultResolvers } from "../../collectionUtils"
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
import schema from "./schema";

export const PostEmbeddings: PostEmbeddingsCollection = createCollection({
  collectionName: "PostEmbeddings",
  typeName: "PostEmbedding",
  collectionType: "pg",
  schema,
  resolvers: getDefaultResolvers("PostEmbeddings"),
  mutations: getDefaultMutations("PostEmbeddings"),
  logChanges: true,
});

addUniversalFields({collection: PostEmbeddings});

export default PostEmbeddings;
