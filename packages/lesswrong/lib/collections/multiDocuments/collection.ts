import { makeEditable } from "@/lib/editor/make_editable";
import schema from "./schema";
import { userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { canMutateParentDocument, getRootDocument } from "./helpers";
import { addSlugFields } from "@/lib/utils/schemaUtils";
import { createCollection } from "@/lib/vulcan-lib/collections.ts";
import { addUniversalFields } from "@/lib/collectionUtils";
import { getDefaultMutations } from "@/lib/vulcan-core/default_mutations.ts";
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers.ts";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const MultiDocuments = createCollection({
  collectionName: 'MultiDocuments',
  typeName: 'MultiDocument',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('MultiDocuments', { parentDocumentId: 1, collectionName: 1 });
    indexSet.addIndex('MultiDocuments', { slug: 1 });
    indexSet.addIndex('MultiDocuments', { oldSlugs: 1 });
    indexSet.addCustomPgIndex(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_multi_documents_pingbacks ON "MultiDocuments" USING gin(pingbacks);`);
    return indexSet;
  },
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
  voteable: {
    timeDecayScoresCronjob: false,
  },
});

addUniversalFields({ collection: MultiDocuments, legacyDataOptions: { canRead: ['guests'] } });
addSlugFields({
  collection: MultiDocuments,
  collectionsToAvoidCollisionsWith: ["Tags", "MultiDocuments"],
  getTitle: (md) => md.title ?? md.tabTitle,
  onCollision: "rejectNewDocument",
  includesOldSlugs: true,
});

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
