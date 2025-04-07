import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { editCheck as editTagCheck, newCheck as newTagCheck } from "@/server/collections/tags/mutations";

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

/**
 * The logic for validating whether a user can either create or update a multi-document is basically the same.
 * In both cases, we defer to the `check` defined on the parent document's collection to see if the user would be allowed to mutate the parent document.
 */
export async function canMutateParentDocument(user: DbUser | null, multiDocument: DbMultiDocument | CreateMultiDocumentDataInput | null, mutation: 'create' | 'update', context: ResolverContext) {
  if (!multiDocument) {
    return false;
  }

  if (userIsAdmin(user)) {
    return true;
  }

  const rootDocumentInfo = await getRootDocument(multiDocument, context);
  if (!rootDocumentInfo) {
    return false;
  }

  const { document: parentDocument } = rootDocumentInfo;
  const check = mutation === 'create' ? newTagCheck : editTagCheck;
  return check(user, parentDocument);
}
