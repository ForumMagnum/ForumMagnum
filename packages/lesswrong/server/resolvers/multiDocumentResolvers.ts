import { MultiDocuments } from "@/lib/collections/multiDocuments/collection";
import { GraphQLJSON } from "graphql-type-json";
import { accessFilterMultiple, augmentFieldsDict } from "@/lib/utils/schemaUtils";
import { getToCforMultiDocument } from "../tableOfContents";
import { loadByIds } from "@/lib/loaders";
import { defineMutation } from "../utils/serverGraphqlUtil";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import { updateMutator } from "../vulcan-lib";
import { contributorsField } from '../utils/contributorsFieldHelper';

augmentFieldsDict(MultiDocuments, {
  contributors: contributorsField({
    collectionName: 'MultiDocuments',
    fieldName: 'contents',
  }),
  tableOfContents: {
    resolveAs: {
      arguments: 'version: String',
      type: GraphQLJSON,
      resolver: async (document: DbMultiDocument, { version }: { version: string | null }, context: ResolverContext) => {
        return await getToCforMultiDocument({ document, version, context });
      },
    },
  },
});

defineMutation({
  name: 'reorderSummaries',
  argTypes: `(parentDocumentId: String!, parentDocumentCollectionName: String!, summaryIds: [String!]!)`,
  resultType: 'Boolean',
  fn: async (root, { parentDocumentId, parentDocumentCollectionName, summaryIds }: { parentDocumentId: string, parentDocumentCollectionName: string, summaryIds: string[] }, context) => {
    const { currentUser, loaders, MultiDocuments } = context;
    if (!currentUser) {
      throw new Error('Must be logged in to reorder summaries');
    }

    if (!(parentDocumentCollectionName in loaders)) {
      throw new Error(`Collection ${parentDocumentCollectionName} not found`);
    }

    const [parentDocument, summaries] = await Promise.all([
      loaders[parentDocumentCollectionName as keyof typeof loaders].load(parentDocumentId),
      filterNonnull(await loadByIds(context, 'MultiDocuments', summaryIds)),
    ]);

    if (!parentDocument) {
      throw new Error('Parent document not found');
    }

    if (summaries.length === 0) {
      throw new Error('Summaries not found');
    }

    if (summaries.some(s => s.parentDocumentId !== parentDocument._id)) {
      throw new Error('Summaries do not belong to the parent document');
    }

    // Check that the user has permission to edit at least the first summary
    // (permissions should be the same for all summaries, since they are all summaries of the same parent document)
    if (MultiDocuments.options.mutations?.update?.check) {
      const canEditFirstSummary = await MultiDocuments.options.mutations?.update?.check(currentUser, summaries[0]);
      if (!canEditFirstSummary) {
        throw new Error('User does not have permission to edit summaries for this document');
      }
    }

    // This is not even remotely safe, but lol.
    for (const [index, summaryId] of summaryIds.entries()) {
      await updateMutator({
        collection: MultiDocuments,
        documentId: summaryId,
        set: { index },
        currentUser,
        context,
      });
    }

    return true;
  },
});
