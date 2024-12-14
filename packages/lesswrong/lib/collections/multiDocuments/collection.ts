import { createCollection, getCollection } from "@/lib/vulcan-lib";
import { addUniversalFields, getDefaultMutations, getDefaultResolvers } from "@/lib/collectionUtils";
import { makeEditable } from "@/lib/editor/make_editable";
import schema from "./schema";
import { ensureIndex } from "@/lib/collectionIndexUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { getRootDocument } from "./helpers";

export const MultiDocuments = createCollection({
  collectionName: 'MultiDocuments',
  typeName: 'MultiDocument',
  schema,
  resolvers: getDefaultResolvers('MultiDocuments'),
  mutations: getDefaultMutations('MultiDocuments', {
    newCheck: (user) => {
      return userIsAdmin(user);
    },
    editCheck: async (user, multiDocument) => {
      if (!multiDocument) {
        return false;
      }

      if (userIsAdmin(user)) {
        return true;
      }

      const parentCollectionName = multiDocument.collectionName;
      let parentDocumentCollection = getCollection(parentCollectionName);
      let parentDocument = await parentDocumentCollection.findOne({ _id: multiDocument.parentDocumentId });
      if (!parentDocument) {
        return false;
      }

      // If the parent isn't a tag, it's a multi-document, and this is a summary whose parent is a lens.
      // We need to recurse once to get the parent tag.
      if (parentCollectionName !== 'Tags') {
        parentDocumentCollection = getCollection('Tags');
        parentDocument = await parentDocumentCollection.findOne({ _id: (parentDocument as DbMultiDocument).parentDocumentId });
      }
      
      const check = parentDocumentCollection.options.mutations?.update?.check;
      // editCheck should always exist for tags, but...
      if (!check) {
        // eslint-disable-next-line no-console
        console.error(`No check for update mutation on parent collection ${parentCollectionName} when trying to edit MultiDocument ${multiDocument._id}`);
        return false;
      }
      const canEditParentTag = await check(user, parentDocument);
      return canEditParentTag;
    },
    removeCheck: () => {
      return false;
    },
  }),
});

addUniversalFields({ collection: MultiDocuments, legacyDataOptions: { canRead: ['guests'] } });

ensureIndex(MultiDocuments, { parentDocumentId: 1, collectionName: 1 });
ensureIndex(MultiDocuments, { slug: 1 });
ensureIndex(MultiDocuments, { oldSlugs: 1 });

makeEditable({
  collection: MultiDocuments,
  options: {
    fieldName: "contents",
    commentStyles: true,
    normalized: true,
    revisionsHaveCommitMessages: true,
    pingbacks: true,
    permissions: {
      canRead: ['guests'],
      canUpdate: ['members'],
      canCreate: ['members']
    },
    getLocalStorageId: (multiDocument: DbMultiDocument, name: string) => {
      const { _id, parentDocumentId, collectionName } = multiDocument;
      return { id: `multiDocument:${collectionName}:${parentDocumentId}:${_id}`, verify: false };
    },
  },
});

MultiDocuments.checkAccess = async (user: DbUser | null, multiDocument: DbMultiDocument, context: ResolverContext | null) => {
  const rootDocumentInfo = await getRootDocument(multiDocument);
  if (!rootDocumentInfo) {
    return false;
  }

  const { document, collection } = rootDocumentInfo;

  if ('checkAccess' in collection && collection.checkAccess) {
    return collection.checkAccess(user, document, context);
  }

  return true;
};
