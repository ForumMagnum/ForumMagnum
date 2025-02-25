import { createCollection } from "../../vulcan-lib/collections";
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
import schema from "./schema";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const PostEmbeddings: PostEmbeddingsCollection = createCollection({
  collectionName: "PostEmbeddings",
  typeName: "PostEmbedding",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('PostEmbeddings', { postId: 1, model: 1 }, { unique: true });
    return indexSet;
  },
  resolvers: getDefaultResolvers("PostEmbeddings"),
  mutations: getDefaultMutations("PostEmbeddings"),
  logChanges: false,
});

addUniversalFields({collection: PostEmbeddings});

export default PostEmbeddings;
