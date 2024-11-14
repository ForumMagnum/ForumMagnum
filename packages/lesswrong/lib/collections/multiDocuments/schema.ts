const schema: SchemaType<"MultiDocuments"> = {
  name: {
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
