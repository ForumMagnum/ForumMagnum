const schema: SchemaType<"Images"> = {
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
