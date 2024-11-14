const schema: SchemaType<"MultiDocuments"> = {
  title: {
    type: String,
    canRead: ['guests'],
  },
  subtitle: {
    type: String,
    canRead: ['guests'],
    optional: true,
    nullable: true,
  },
  userId: {
    type: String,
    canRead: ['guests'],
  },
  parentDocumentId: {
    type: String,
    canRead: ['guests'],
  },
  collectionName: {
    type: String,
    canRead: ['guests'],
    typescriptType: "CollectionNameString",
  },
};

export default schema;
