import { MultiDocuments } from "@/lib/collections/multiDocuments/collection";
import { GraphQLJSON } from "graphql-type-json";
import { accessFilterMultiple, augmentFieldsDict } from "@/lib/utils/schemaUtils";
import { getToCforMultiDocument } from "../tableOfContents";
import Revisions from "@/lib/collections/revisions/collection";
import toDictionary from "@/lib/utils/toDictionary";
import sumBy from "lodash/sumBy";
import groupBy from "lodash/groupBy";
import filter from "lodash/filter";
import { compareVersionNumbers } from "@/lib/editor/utils";
import { loadByIds } from "@/lib/loaders";
import keyBy from "lodash/keyBy";
import orderBy from "lodash/orderBy";
import { defineMutation } from "../utils/serverGraphqlUtil";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import { updateMutator } from "../vulcan-lib";

type LensContributorWithStats = {
  user: Partial<DbUser>,
  contributionVolume: number,
};

type LensContributorStats = {
  contributionVolume: number,
};

type LensContributorStatsMap = Partial<Record<string,LensContributorStats>>;

export async function updateDenormalizedContributorsList(multiDoc: DbMultiDocument): Promise<LensContributorStatsMap> {
  const contributionStats = await buildContributorsList(multiDoc, null);
  
  if (JSON.stringify(multiDoc.contributionStats) !== JSON.stringify(contributionStats)) {
    await MultiDocuments.rawUpdateOne({_id: multiDoc._id}, {$set: {
      contributionStats: contributionStats,
    }});
  }
  return contributionStats;
}

async function getContributorsList(multiDoc: DbMultiDocument, version: string|null): Promise<LensContributorStatsMap> {
  if (version)
    return await buildContributorsList(multiDoc, version);
  else if (multiDoc.contributionStats)
    return multiDoc.contributionStats;
  else
    return await updateDenormalizedContributorsList(multiDoc);
}

async function buildContributorsList(multiDoc: DbMultiDocument, version: string|null): Promise<LensContributorStatsMap> {
  if (!(multiDoc?._id))
    throw new Error("Invalid multiDoc");
  
  const multiDocRevisions: DbRevision[] = await Revisions.find({
    collectionName: "MultiDocuments",
    fieldName: "contents",
    documentId: multiDoc._id,
    $or: [
      {"changeMetrics.added": {$gt: 0}},
      {"changeMetrics.removed": {$gt: 0}}
    ],
  }).fetch();
  
  const filteredTagRevisions = version
    ? multiDocRevisions.filter(r => compareVersionNumbers(version, r.version) >= 0)
    : multiDocRevisions;
  
  const revisionsByUserId: Record<string,DbRevision[]> = groupBy(filteredTagRevisions, r=>r.userId);
  const contributorUserIds: string[] = Object.keys(revisionsByUserId);
  const contributionStatsByUserId: Partial<Record<string,LensContributorStats>> = toDictionary(contributorUserIds,
    userId => userId,
    userId => {
      const revisionsByThisUser = filter(multiDocRevisions, r=>r.userId===userId);
      const contributionVolume = sumBy(revisionsByThisUser, r=>r.changeMetrics.added + r.changeMetrics.removed);

      return {contributionVolume};
    }
  );
  return contributionStatsByUserId;
}


augmentFieldsDict(MultiDocuments, {
  contributors: {
    resolveAs: {
      arguments: 'multiDocumentVersion: String',
      type: "MultiDocumentContributorsList",
      resolver: async (multiDoc: DbMultiDocument, { multiDocumentVersion: version }: { multiDocumentVersion: string | null }, context: ResolverContext): Promise<{
        contributors: LensContributorWithStats[],
        totalCount: number,
      }> => {
        const { Users } = context;
        const contributionStatsByUserId = await getContributorsList(multiDoc, version);
        const contributorUserIds = Object.keys(contributionStatsByUserId);
        const contributorUsersUnfiltered = await loadByIds(context, "Users", contributorUserIds);
        const contributorUsers = await accessFilterMultiple(context.currentUser, Users, contributorUsersUnfiltered, context);
        const usersById = keyBy(contributorUsers, u => u._id) as Record<string, Partial<DbUser>>;
  
        const sortedContributors = orderBy(contributorUserIds, userId => -contributionStatsByUserId[userId]!.contributionVolume);
        
        const contributorsWithStats: LensContributorWithStats[] = sortedContributors.map(userId => ({
          user: usersById[userId],
          ...contributionStatsByUserId[userId]!,
        }));

        return {
          contributors: contributorsWithStats,
          totalCount: contributorsWithStats.length,
        }
      }
    }
  },
  tableOfContents: {
    resolveAs: {
      arguments: 'multiDocumentVersion: String',
      type: GraphQLJSON,
      resolver: async (document: DbMultiDocument, { multiDocumentVersion: version }: { multiDocumentVersion: string | null }, context: ResolverContext) => {
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
