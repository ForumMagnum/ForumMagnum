import { forumSelect } from '@/lib/forumTypeUtils';
import { getContributorsList, ContributorWithStats } from '@/server/utils/contributorsUtil';
import { loadByIds } from '@/lib/loaders';
import { accessFilterMultiple } from '@/lib/utils/schemaUtils';
import keyBy from 'lodash/keyBy';
import orderBy from 'lodash/orderBy';
import take from 'lodash/take';

type ContributorsFieldOptions = {
  collectionName: 'Tags';
  fieldName: 'description';
} | {
  collectionName: 'MultiDocuments';
  fieldName: 'contents';
};

export function getContributorsFieldResolver(options: ContributorsFieldOptions) {
  const { collectionName, fieldName } = options;

  return async function contributorsFieldResolver(
    document: any,
    { limit, version }: { limit?: number; version?: string },
    context: ResolverContext
  ): Promise<{
    contributors: ContributorWithStats[];
    totalCount: number;
  }> {
    const contributionStatsByUserId = await getContributorsList({
      document,
      collectionName,
      fieldName,
      version: version || null,
      context,
    });

    const contributorUserIds = Object.keys(contributionStatsByUserId);
    const contributorUsersUnfiltered = await loadByIds(context, 'Users', contributorUserIds);
    const contributorUsers = await accessFilterMultiple(
      context.currentUser,
      'Users',
      contributorUsersUnfiltered,
      context
    );
    const usersById = keyBy(contributorUsers, u => u._id) as Record<string, Partial<DbUser>>;

    const sortedContributors = orderBy(
      contributorUserIds,
      userId => forumSelect({
        // TODO: But this should be tied to whether the default is using our tag page or not
        LessWrong: -(contributionStatsByUserId[userId]!.currentAttributionCharCount ?? 0),
        AlignmentForum: -(contributionStatsByUserId[userId]!.currentAttributionCharCount ?? 0),
        default: -contributionStatsByUserId[userId]!.contributionScore
      })
    );

    const contributorsWithStats: ContributorWithStats[] = sortedContributors.map(userId => ({
      user: usersById[userId],
      ...contributionStatsByUserId[userId]!,
    }));

    const totalCount = contributorsWithStats.length;

    const contributors = limit ? take(contributorsWithStats, limit) : contributorsWithStats;

    return {
      contributors,
      totalCount,
    };
  }
}

export function contributorsField(options: ContributorsFieldOptions) {
  return {
    resolveAs: {
      type: 'TagContributorsList',
      arguments: 'limit: Int, version: String',
      resolver: getContributorsFieldResolver(options),
    },
  };
}
