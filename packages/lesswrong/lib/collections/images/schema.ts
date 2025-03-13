import { universalFields } from "@/lib/collectionUtils";

const schema: SchemaType<"Images"> = {
  ...universalFields({}),
  /** @deprecated Use identifier + identifierType = 'originalUrl' */
  originalUrl: {
    type: String,
    nullable: true,
  },
  identifier: {
    type: String,
    nullable: false,
  },
  identifierType: {
    type: String,
    allowedValues: ['sha256Hash', 'originalUrl'],
    nullable: false,
  },
  cdnHostedUrl: {
    type: String,
    nullable: false,
  },
};

export default schema;
