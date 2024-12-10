import { getCollection } from "@/lib/vulcan-lib/getCollection";

function isMultiDocument(document: ObjectsByCollectionName[CollectionNameString]): document is DbMultiDocument {
  return 'collectionName' in document && 'parentDocumentId' in document && 'tabTitle' in document;
}

export async function getRootDocument(multiDocument: DbMultiDocument) {
  const visitedDocumentIds = new Set<string>([multiDocument._id]);
  let parentCollection = getCollection(multiDocument.collectionName);
  let parentDocument = await parentCollection.findOne({ _id: multiDocument.parentDocumentId });  
  if (!parentDocument) {
    return null;
  }

  visitedDocumentIds.add(parentDocument._id);

  while (isMultiDocument(parentDocument)) {
    parentCollection = getCollection(parentDocument.collectionName);
    const nextDocument = await parentCollection.findOne({ _id: parentDocument.parentDocumentId });
    if (!nextDocument) {
      return null;
    }

    if (visitedDocumentIds.has(nextDocument._id)) {
      // eslint-disable-next-line no-console
      console.error(`Cycle detected in multi-document hierarchy starting from ${multiDocument._id}`);
      return null;
    }

    visitedDocumentIds.add(nextDocument._id);
    parentDocument = nextDocument;
  }

  return { document: parentDocument, collection: parentCollection };
}
