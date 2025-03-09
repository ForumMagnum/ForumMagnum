import { universalFields } from "@/lib/collectionUtils";

const schema: SchemaType<"ArbitalCaches"> = {
  ...universalFields({}),
  pageAlias: {
    type: String,
    nullable: false,
  },
  title: {
    type: String,
    nullable: false,
  },
  fetchedAt: {
    type: Date,
    nullable: false,
  },
  sanitizedHtml: {
    type: String,
    nullable: false,
  },
};

export default schema;
