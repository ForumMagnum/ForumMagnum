const schema: SchemaType<"LegacyData"> = {
  objectId: {
    type: String,
    nullable: false,
  },
  collectionName: {
    type: String,
    nullable: false,
  },
};

export default schema;
