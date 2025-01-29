import { createCollection } from "../../vulcan-lib";
import { addUniversalFields } from "../../collectionUtils"
import schema from "./schema";
import { ensureIndex } from "../../collectionIndexUtils";

export const CommentEmbeddings: CommentEmbeddingsCollection = createCollection({
  collectionName: "CommentEmbeddings",
  typeName: "CommentEmbedding",
  schema,
  logChanges: false,
});

addUniversalFields({collection: CommentEmbeddings});

ensureIndex(CommentEmbeddings, {commentId: 1, model: 1}, {unique: true});

export default CommentEmbeddings;
