const schema: SchemaType<"MultiDocuments"> = {
  // In the case of tag lenses, this is the title displayed in the body of the tag page when the lens is selected.
  // In the case of summaries, we don't have a title that needs to be in the "body"; we just use the tab title in the summary tab.
  title: {
    type: String,
    canRead: ['guests'],
    optional: true,
    nullable: true,
  },
  preview: {
    type: String,
    canRead: ['guests'],
    optional: true,
    nullable: true,
  },
  tabTitle: {
    type: String,
    canRead: ['guests'],
  },
  tabSubtitle: {
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
  // e.g. content, description, summary.  Whatever it is that we have "multiple" of for a single parent document.
  fieldName: {
    type: String,
    canRead: ['guests'],
  },
  index: {
    type: Number,
    canRead: ['guests'],
  },
  tableOfContents: {
    // Implemented in multiDocumentResolvers.ts
    type: Object,
    canRead: ['guests'],
  },
};

export default schema;
