import { foreignKeyField } from "../../utils/schemaUtils"
import { addUniversalFields } from "../../collectionUtils";

export const EMBEDDINGS_VECTOR_SIZE = 1536;

const commonFields = (nullable = false) => ({
  canRead: ["admins" as const],
  canCreate: ["admins" as const],
  canUpdate: ["admins" as const],
  hidden: true,
  optional: nullable,
  nullable,
});

const schema: SchemaType<"PostEmbeddings"> = {
  ...addUniversalFields({}),
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
    vectorSize: EMBEDDINGS_VECTOR_SIZE,
  },
  "embeddings.$": {
    type: Number,
  },
};

export default schema;
