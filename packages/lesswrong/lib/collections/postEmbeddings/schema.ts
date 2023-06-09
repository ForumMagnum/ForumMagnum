import { foreignKeyField } from "../../utils/schemaUtils"

const commonFields = (nullable = false) => ({
  canRead: ["admins" as const],
  canCreate: ["admins" as const],
  canUpdate: ["admins" as const],
  hidden: true,
  optional: nullable,
  nullable,
});

const schema: SchemaType<DbPostEmbedding> = {
  postId: {
    ...commonFields(),
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: false,
    }),
  },
  postHash: {
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
  },
  "embeddings.$": {
    type: Number,
  },
};

export default schema;
