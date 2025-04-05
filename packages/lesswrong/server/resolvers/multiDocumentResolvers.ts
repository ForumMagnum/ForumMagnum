import { loadByIds } from "@/lib/loaders";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import gql from "graphql-tag";
import { updateMultiDocument } from "../collections/multiDocuments/mutations";


export const multiDocumentTypeDefs = gql`
  extend type Mutation {
    reorderSummaries(parentDocumentId: String!, parentDocumentCollectionName: String!, summaryIds: [String!]!): Boolean
  }
`

export const multiDocumentMutations = {
  async reorderSummaries(root: void, { parentDocumentId, parentDocumentCollectionName, summaryIds }: { parentDocumentId: string, parentDocumentCollectionName: string, summaryIds: string[] }, context: ResolverContext) {
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
      const canEditFirstSummary = await MultiDocuments.options.mutations?.update?.check(currentUser, summaries[0], context);
      if (!canEditFirstSummary) {
        throw new Error('User does not have permission to edit summaries for this document');
      }
    }

    // This is not even remotely safe, but lol.
    for (const [index, summaryId] of summaryIds.entries()) {
      await updateMultiDocument({ data: { index }, selector: { _id: summaryId } }, context);
    }

    return true;
  }
}
