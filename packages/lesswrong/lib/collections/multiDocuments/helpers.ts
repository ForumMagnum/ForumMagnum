import { userIsAdminOrMod, userOwns } from "@/lib/vulcan-users/permissions";

const MULTI_DOCUMENT_DELETION_WINDOW = 1000 * 60 * 60 * 24 * 7;

export function isMultiDocument(document: DbTag | DbMultiDocument): document is DbMultiDocument {
  return 'collectionName' in document && 'parentDocumentId' in document && 'tabTitle' in document;
}

export async function getRootDocument(
  multiDocument: DbMultiDocument | CreateMultiDocumentDataInput,
  context: ResolverContext
) {
  const multiDocumentId = '_id' in multiDocument ? [multiDocument._id] : [];
  const visitedDocumentIds = new Set<string>(multiDocumentId);
  let parentCollectionName = multiDocument.collectionName as 'Tags' | 'MultiDocuments';
  const parentDocumentOrNull = await context.loaders[parentCollectionName].load(multiDocument.parentDocumentId);
  if (!parentDocumentOrNull) {
    return null;
  }
  let parentDocument = parentDocumentOrNull;

  visitedDocumentIds.add(parentDocument._id);

  while (isMultiDocument(parentDocument)) {
    parentCollectionName = parentDocument.collectionName as 'Tags' | 'MultiDocuments';
    const nextDocument = await context.loaders[parentCollectionName].load(parentDocument.parentDocumentId);
    if (!nextDocument) {
      return null;
    }

    if (visitedDocumentIds.has(nextDocument._id)) {
      // eslint-disable-next-line no-console
      console.error(`Cycle detected in multi-document hierarchy starting from ${JSON.stringify(multiDocument)}`);
      return null;
    }

    visitedDocumentIds.add(nextDocument._id);
    parentDocument = nextDocument;
  }

  return { document: parentDocument, parentCollectionName: 'Tags' as const };
}

export function userCanDeleteMultiDocument(user: DbUser | UsersCurrent | null, document: Pick<DbMultiDocument, "userId" | "createdAt">) {
  if (userIsAdminOrMod(user)) {
    return true;
  }

  const deletableUntil = new Date(document.createdAt).getTime() + MULTI_DOCUMENT_DELETION_WINDOW;
  const withinDeletionWindow = deletableUntil > Date.now();

  return userOwns(user, document) && withinDeletionWindow;
}

