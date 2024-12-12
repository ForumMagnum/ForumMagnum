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
import take from "lodash/take";

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
      arguments: 'limit: Int, version: String',
      type: "MultiDocumentContributorsList",
      resolver: async (multiDoc: DbMultiDocument, {limit, version}: {limit?: number, version?: string}, context: ResolverContext): Promise<{
        contributors: LensContributorWithStats[],
        totalCount: number,
      }> => {
        const { Users } = context;
        const contributionStatsByUserId = await getContributorsList(multiDoc, version||null);
        const contributorUserIds = Object.keys(contributionStatsByUserId);
        const contributorUsersUnfiltered = await loadByIds(context, "Users", contributorUserIds);
        const contributorUsers = await accessFilterMultiple(context.currentUser, Users, contributorUsersUnfiltered, context);
        const usersById = keyBy(contributorUsers, u => u._id) as Record<string, Partial<DbUser>>;
  
        const sortedContributors = orderBy(contributorUserIds, userId => -contributionStatsByUserId[userId]!.contributionVolume);
        
        const contributorsWithStats: LensContributorWithStats[] = sortedContributors.map(userId => ({
          user: usersById[userId],
          ...contributionStatsByUserId[userId]!,
        }));

        if (limit) {
          return {
            contributors: take(contributorsWithStats, limit),
            totalCount: contributorsWithStats.length,
          }
        } else {
          return {
            contributors: contributorsWithStats,
            totalCount: contributorsWithStats.length,
          }
        }
      }
    }
  },
  tableOfContents: {
    resolveAs: {
      arguments: 'version: String',
      type: GraphQLJSON,
      resolver: async (document: DbMultiDocument, args: { version: string | null }, context: ResolverContext) => {
        return await getToCforMultiDocument({ document, version: args.version, context });
      },
    },
  },
});
