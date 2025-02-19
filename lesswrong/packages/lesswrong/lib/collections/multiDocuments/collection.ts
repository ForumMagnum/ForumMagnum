import { createCollection, getCollection } from "@/lib/vulcan-lib";
import { addUniversalFields, getDefaultMutations, getDefaultResolvers } from "@/lib/collectionUtils";
import { makeEditable } from "@/lib/editor/make_editable";
import schema from "./schema";
import { ensureIndex } from "@/lib/collectionIndexUtils";
import { membersGroup, userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { canMutateParentDocument, getRootDocument } from "./helpers";
import { makeVoteable } from "@/lib/make_voteable";
import { addSlugFields } from "@/lib/utils/schemaUtils";

export const MultiDocuments = createCollection({
  collectionName: 'MultiDocuments',
  typeName: 'MultiDocument',
  schema,
  resolvers: getDefaultResolvers('MultiDocuments'),
  mutations: getDefaultMutations('MultiDocuments', {
    newCheck: (user, multiDocument) => canMutateParentDocument(user, multiDocument, 'create'),
    editCheck: async (user, multiDocument: DbMultiDocument) => {
      const canEditParent = await canMutateParentDocument(user, multiDocument, 'update');
      if (!canEditParent) {
        return false;
      }

      // If the multi-document is deleted, we also need to check if the user owns it
      if (multiDocument.deleted) {
        return userIsAdmin(user) || userOwns(user, multiDocument);
      }

      return true;
    },
    removeCheck: () => false,
  }),
  logChanges: true,
});

addUniversalFields({ collection: MultiDocuments, legacyDataOptions: { canRead: ['guests'] } });
addSlugFields({
  collection: MultiDocuments,
  collectionsToAvoidCollisionsWith: ["Tags", "MultiDocuments"],
  getTitle: (md) => md.title ?? md.tabTitle,
  onCollision: "rejectNewDocument",
  includesOldSlugs: true,
});

ensureIndex(MultiDocuments, { parentDocumentId: 1, collectionName: 1 });
ensureIndex(MultiDocuments, { slug: 1 });
ensureIndex(MultiDocuments, { oldSlugs: 1 });

makeEditable({
  collection: MultiDocuments,
  options: {
    fieldName: "contents",
    order: 30,
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

MultiDocuments.checkAccess = async (user: DbUser | null, multiDocument: DbMultiDocument, context: ResolverContext | null, outReasonDenied) => {
  if (userIsAdmin(user)) {
    return true;
  }

  const rootDocumentInfo = await getRootDocument(multiDocument, context);
  if (!rootDocumentInfo) {
    return false;
  }

  const { document, collection } = rootDocumentInfo;

  if ('checkAccess' in collection && collection.checkAccess) {
    const canAccessParent = await collection.checkAccess(user, document, context, outReasonDenied);
    if (!canAccessParent) {
      return false;
    }
  }

  return true;
};

membersGroup.can([
  'multidocuments.smallDownvote',
  'multidocuments.bigDownvote',
  'multidocuments.smallUpvote',
  'multidocuments.bigUpvote',
]);

makeVoteable(MultiDocuments, {
  timeDecayScoresCronjob: false,
});
