import { createCollection } from "../../vulcan-lib/collections";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import schema from "./schema";
import { ensureIndex } from "../../collectionIndexUtils";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

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
