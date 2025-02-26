import { getCollection } from "@/lib/vulcan-lib/getCollection";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";

export function isMultiDocument(document: ObjectsByCollectionName[CollectionNameString]): document is DbMultiDocument {
  return 'collectionName' in document && 'parentDocumentId' in document && 'tabTitle' in document;
}

export async function getRootDocument(multiDocument: DbMultiDocument, context: ResolverContext|null) {
  const visitedDocumentIds = new Set<string>([multiDocument._id]);
  let parentCollection = getCollection(multiDocument.collectionName);
  const parentDocumentOrNull = context
    ? await context.loaders[multiDocument.collectionName].load(multiDocument.parentDocumentId)
    : await parentCollection.findOne({ _id: multiDocument.parentDocumentId });
  if (!parentDocumentOrNull) {
    return null;
  }
  let parentDocument = parentDocumentOrNull;

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

/**
 * The logic for validating whether a user can either create or update a multi-document is basically the same.
 * In both cases, we defer to the `check` defined on the parent document's collection to see if the user would be allowed to mutate the parent document.
 */
export async function canMutateParentDocument(user: DbUser | null, multiDocument: DbMultiDocument | null, mutation: 'create' | 'update', context: ResolverContext) {
  if (!multiDocument) {
    return false;
  }

  if (userIsAdmin(user)) {
    return true;
  }

  const rootDocumentInfo = await getRootDocument(multiDocument, null);
  if (!rootDocumentInfo) {
    return false;
  }

  const { document: parentDocument, collection: parentDocumentCollection } = rootDocumentInfo;
  const check = parentDocumentCollection.options.mutations?.[mutation]?.check;
  if (!check) {
    // eslint-disable-next-line no-console
    console.error(`No check for ${mutation} mutation on parent collection ${parentDocumentCollection.collectionName} when trying to ${mutation} MultiDocument for parent with id ${parentDocument._id}`);
    return false;
  }

  return check(user, parentDocument, context);
}
