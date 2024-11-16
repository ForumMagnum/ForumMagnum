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
  fieldName: {
    type: String,
    canRead: ['guests'],
  },
  index: {
    type: Number,
    canRead: ['guests'],
  },
};

export default schema;
