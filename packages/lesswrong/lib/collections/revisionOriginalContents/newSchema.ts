import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  originalContents: {
    database: {
      type: "JSONB",
      nullable: false,
    },
    graphql: {
      outputType: "JSON!",
      canRead: ["admins"],
      validation: {
        blackbox: true,
      },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"RevisionOriginalContents">>;

export default schema;
