import { foreignKeyField } from "../../utils/schemaUtils"

// This is the largest vector size that both Voyage and our current version of pgvector can handle
// If we figure out how to upgrade pgvector to 0.7.0 (which might require upgrading our RDS instance version),
// we can increase this to 2048 and use a halfvec index
// So technically we could just have do 2048 right now and not implement the index, but I suspect we'll want the index and the perf loss is small
export const EMBEDDINGS_VECTOR_SIZE = 1024;

const commonFields = (nullable = false) => ({
  canRead: ["admins" as const],
  canCreate: ["admins" as const],
  canUpdate: ["admins" as const],
  hidden: true,
  optional: nullable,
  nullable,
});

const schema: SchemaType<"CommentEmbeddings"> = {
  commentId: {
    ...commonFields(),
    ...foreignKeyField({
      idFieldName: "commentId",
      resolverName: "comment",
      collectionName: "Comments",
      type: "Comment",
      nullable: false,
    }),
  },
  commentHash: {
    ...commonFields(),
    type: String,
  },
  lastGeneratedAt: {
    ...commonFields(),
    type: Date,
  },
  model: {
    ...commonFields(),
    type: String,
  },
  embeddings: {
    ...commonFields(),
    type: Array,
    vectorSize: EMBEDDINGS_VECTOR_SIZE,
  },
  "embeddings.$": {
    type: Number,
  },
};

export default schema;
