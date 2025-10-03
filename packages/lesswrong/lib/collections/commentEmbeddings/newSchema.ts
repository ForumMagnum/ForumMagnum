import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

// This is the largest vector size that both Voyage and our current version of pgvector can handle
// If we figure out how to upgrade pgvector to 0.7.0 (which might require upgrading our RDS instance version),
// we can increase this to 2048 and use a halfvec index
// So technically we could just have do 2048 right now and not implement the index, but I suspect we'll want the index and the perf loss is small
export const EMBEDDINGS_VECTOR_SIZE = 1024;

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  commentId: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
  },
  lastGeneratedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  model: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  embeddings: {
    database: {
      type: `VECTOR(${EMBEDDINGS_VECTOR_SIZE})`,
      nullable: false,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"CommentEmbeddings">>;

export default schema;
