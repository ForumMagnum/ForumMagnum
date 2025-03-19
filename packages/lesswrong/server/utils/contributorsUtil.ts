import { Revisions } from '@/server/collections/revisions/collection';
import sumBy from 'lodash/sumBy';
import groupBy from 'lodash/groupBy';
import { computeAttributions } from '../attributeEdits';
import { compareVersionNumbers } from '@/lib/editor/utils';
import VotesRepo from '../repos/VotesRepo';
import toDictionary from '@/lib/utils/toDictionary';
import { getCollection } from '../collections/allCollections';
import { isLWorAF } from '@/lib/instanceSettings';

export type ContributorStats = {
  contributionScore: number;
  numCommits: number;
  voteCount: number;
  currentAttributionCharCount?: number;
};

export type ContributorWithStats = {
  user: Partial<DbUser>,
  contributionScore: number,
  numCommits: number,
  voteCount: number,
  currentAttributionCharCount?: number,
};

export type ContributorStatsList = Partial<Record<string,ContributorWithStats>>;


export type ContributorStatsMap = Partial<Record<string, ContributorStats>>;

interface BuildContributorsListOptions {
  document: { _id: string; [key: string]: any };
  collectionName: string;
  fieldName: string;
  version: string | null;
}

export async function buildContributorsList(options: BuildContributorsListOptions): Promise<ContributorStatsMap> {
  const { document, collectionName, fieldName, version } = options;

  if (!document?._id) throw new Error("Invalid document");

  const revisions: DbRevision[] = await Revisions.find({
    collectionName,
    fieldName,
    documentId: document._id,
    skipAttributions: false,
    $or: [
      { "changeMetrics.added": { $gt: 0 } },
      { "changeMetrics.removed": { $gt: 0 } },
    ],
  }).fetch();

  const votesRepo = new VotesRepo();
  const selfVotes = await votesRepo.getSelfVotes(revisions.map(r => r._id));
  const selfVotesByUser = groupBy(selfVotes, v => v.userId);
  const selfVoteScoreAdjustmentByUser = toDictionary(
    Object.keys(selfVotesByUser),
    userId => userId,
    userId => {
      const selfVotesForUser = selfVotesByUser[userId];
      const totalSelfVotePower = sumBy(selfVotesForUser, v => v.power);
      const strongestSelfVote = selfVotesForUser.reduce((max, v) => Math.max(max, v.power), 0);
      const numSelfVotes = selfVotesForUser.length;
      return {
        excludedPower: totalSelfVotePower - strongestSelfVote,
        excludedVoteCount: numSelfVotes > 0 ? numSelfVotes - 1 : 0,
      };
    }
  );

  const filteredRevisions = version
    ? revisions.filter(r => compareVersionNumbers(version, r.version) >= 0)
    : revisions;

  const revisionsByUserId = groupBy(filteredRevisions, r => r.userId);
  const contributorUserIds: string[] = Object.keys(revisionsByUserId);

  const attributionsData =
    fieldName === 'description' || fieldName === 'contents'
      ? await computeAttributions(document._id, collectionName, fieldName, version)
      : null;

  const currentCharContribution: Record<string, number> = {};

  if (attributionsData) {
    const { attributions } = attributionsData;
    for (const userId of attributions) {
      if (userId) {
        currentCharContribution[userId] = (currentCharContribution[userId] || 0) + 1;
      }
    }
  }

  const contributionStatsByUserId: ContributorStatsMap = toDictionary(
    contributorUserIds,
    userId => userId,
    userId => {
      const userRevisions = revisionsByUserId[userId];
      const totalRevisionScore = sumBy(userRevisions, r => r.baseScore) || 0;
      const selfVoteAdjustment = selfVoteScoreAdjustmentByUser[userId] || { excludedPower: 0, excludedVoteCount: 0 };
      const charsContributed = currentCharContribution[userId] || 0;

      return {
        contributionScore: totalRevisionScore - selfVoteAdjustment.excludedPower,
        numCommits: userRevisions.length,
        voteCount: sumBy(userRevisions, r => r.voteCount ?? 0) - selfVoteAdjustment.excludedVoteCount,
        currentAttributionCharCount: charsContributed,
      };
    }
  );

  return contributionStatsByUserId;
}

interface GetContributorsListOptions {
  document: { _id: string; contributionStats?: ContributorStatsMap; [key: string]: any };
  collectionName: CollectionNameString;
  fieldName: string;
  version: string | null;
}

function contributionStatsNeedInvalidation(contributionStats: ContributorStatsMap): boolean {
  if (!isLWorAF) return false;

  return Object.values(contributionStats).some(stats => stats?.currentAttributionCharCount === undefined);
}

export async function getContributorsList(options: GetContributorsListOptions): Promise<ContributorStatsMap> {
  const { document, collectionName, fieldName, version } = options;

  if (version) {
    return await buildContributorsList({ document, collectionName, fieldName, version });
  } else if (document.contributionStats && Object.values(document.contributionStats) && !contributionStatsNeedInvalidation(document.contributionStats)) {
    return document.contributionStats;
  } else {
    return await updateDenormalizedContributorsList({ document, collectionName, fieldName });
  }
}

interface UpdateDenormalizedContributorsListOptions {
  document: { _id: string; contributionStats?: ContributorStatsMap; [key: string]: any };
  collectionName: CollectionNameString;
  fieldName: string;
}

export async function updateDenormalizedContributorsList(options: UpdateDenormalizedContributorsListOptions): Promise<ContributorStatsMap> {
  const { document, collectionName, fieldName } = options;
  const contributionStats = await buildContributorsList({ document, collectionName, fieldName, version: null });

  if (JSON.stringify(document.contributionStats) !== JSON.stringify(contributionStats)) {
    const collection = getCollection(collectionName);
    await collection.rawUpdateOne({ _id: document._id }, { $set: { contributionStats } });
  }

  return contributionStats;
}
