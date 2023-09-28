import { addGraphQLResolvers, addGraphQLQuery, addGraphQLSchema, addGraphQLMutation } from '../../lib/vulcan-lib/graphql';
import { mergeFeedQueries, defineFeedResolver, viewBasedSubquery, SubquerySortField, SortDirection } from '../utils/feedUtil';
import { Comments } from '../../lib/collections/comments/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import { Tags } from '../../lib/collections/tags/collection';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { Votes } from '../../lib/collections/votes/collection';
import { Users } from '../../lib/collections/users/collection';
import { Posts } from '../../lib/collections/posts';
import { augmentFieldsDict, accessFilterMultiple, resolverOnlyField, augmentResolverOnlyField } from '../../lib/utils/schemaUtils';
import { compareVersionNumbers } from '../../lib/editor/utils';
import { toDictionary } from '../../lib/utils/toDictionary';
import { loadByIds } from '../../lib/loaders';
import moment from 'moment';
import sumBy from 'lodash/sumBy';
import groupBy from 'lodash/groupBy';
import keyBy from 'lodash/keyBy';
import orderBy from 'lodash/orderBy';
import mapValues from 'lodash/mapValues';
import take from 'lodash/take';
import filter from 'lodash/filter';
import * as _ from 'underscore';
import {
  defaultSubforumSorting,
  SubforumSorting,
  subforumSortings,
  subforumSortingToResolverName,
  subforumSortingTypes,
} from '../../lib/collections/tags/subforumHelpers';
import { VotesRepo } from '../repos';
import { getTagBotUserId } from '../languageModels/autoTagCallbacks';
import UserTagRels from '../../lib/collections/userTagRels/collection';
import { createMutator, updateMutator } from '../vulcan-lib';

// DEPRECATED: here for backwards compatibility
export async function recordSubforumView(userId: string, tagId: string) {
  const existingRel = await UserTagRels.findOne({userId, tagId});
  if (existingRel) {
    await updateMutator({
      collection: UserTagRels,
      documentId: existingRel._id,
      set: {subforumLastVisitedAt: new Date()},
      validate: false,
    })
  } else {
    await createMutator({
      collection: UserTagRels,
      document: {userId, tagId, subforumLastVisitedAt: new Date()},
      validate: false,
    })
  }
}

type SubforumFeedSort = {
  posts: SubquerySortField<DbPost, keyof DbPost>,
  comments: SubquerySortField<DbComment, keyof DbComment>,
  sortDirection?: SortDirection,
}

const subforumFeedSortings: Record<SubforumSorting, SubforumFeedSort> = {
  magic: {
    posts: { sortField: "score" },
    comments: { sortField: "score" },
  },
  new: {
    posts: { sortField: "postedAt" },
    comments: { sortField: "postedAt" },
  },
  old: {
    posts: { sortField: "postedAt", sortDirection: "asc" },
    comments: { sortField: "postedAt", sortDirection: "asc" },
    sortDirection: "asc",
  },
  top: {
    posts: { sortField: "baseScore" },
    comments: { sortField: "baseScore" },
  },
  recentComments: {
    posts: { sortField: "lastCommentedAt" },
    comments: { sortField: "lastSubthreadActivity" },
  },
}

const createSubforumFeedResolver = <SortKeyType>(sorting: SubforumFeedSort) => async ({
  limit = 20, cutoff, offset, args: {tagId, af}, context,
}: {
  limit?: number,
  cutoff?: SortKeyType,
  offset?: number,
  args: {tagId: string, af?: boolean},
  context: ResolverContext,
}) => mergeFeedQueries({
  limit,
  cutoff,
  offset,
  sortDirection: sorting.sortDirection,
  subqueries: [
    // Subforum posts
    viewBasedSubquery({
      type: "tagSubforumPosts",
      collection: Posts,
      ...sorting.posts,
      context,
      selector: {
        [`tagRelevance.${tagId}`]: {$gte: 1},
        hiddenRelatedQuestion: undefined,
        shortform: undefined,
        groupId: undefined,
        ...(af ? {af: true} : undefined),
      },
    }),
    // Subforum comments
    viewBasedSubquery({
      type: "tagSubforumComments",
      collection: Comments,
      ...sorting.comments,
      context,
      selector: {
        $or: [{tagId: tagId, tagCommentType: "SUBFORUM"}, {relevantTagIds: tagId}],
        topLevelCommentId: {$exists: false},
        subforumStickyPriority: {$exists: false},
        ...(af ? {af: true} : undefined),
      },
    }),
    // Sticky subforum comments
    viewBasedSubquery({
      type: "tagSubforumStickyComments",
      collection: Comments,
      sortField: "subforumStickyPriority",
      sortDirection: "asc",
      sticky: true,
      context,
      selector: {
        tagId,
        tagCommentType: "SUBFORUM",
        topLevelCommentId: {$exists: false},
        subforumStickyPriority: {$exists: true},
        ...(af ? {af: true} : undefined),
      },
    }),
  ],
});

for (const sortBy of subforumSortings) {
  const sorting = subforumFeedSortings[sortBy ?? defaultSubforumSorting] ?? subforumFeedSortings[defaultSubforumSorting];
  defineFeedResolver({
    name: `Subforum${subforumSortingToResolverName(sortBy)}Feed`,
    args: "tagId: String!, af: Boolean",
    cutoffTypeGraphQL: subforumSortingTypes[sortBy],
    resultTypesGraphQL: `
      tagSubforumPosts: Post
      tagSubforumComments: Comment
      tagSubforumStickyComments: Comment
    `,
    resolver: createSubforumFeedResolver(sorting),
  });
}

addGraphQLSchema(`
  type TagUpdates {
    tag: Tag!
    revisionIds: [String!]
    commentCount: Int
    commentIds: [String!]
    lastRevisedAt: Date
    lastCommentedAt: Date
    added: Int
    removed: Int
    users: [User!]
  }
`);

addGraphQLResolvers({
  Mutation: {
    async recordSubforumView(root: void, {userId, tagId}: {userId: string, tagId: string}, context: ResolverContext) {
      await recordSubforumView(userId, tagId);
      return "success";
    }
  },
  Query: {
    async TagUpdatesInTimeBlock(root: void, {before,after}: {before: Date, after: Date}, context: ResolverContext) {
      if (!before) throw new Error("Missing graphql parameter: before");
      if (!after) throw new Error("Missing graphql parameter: after");
      if(moment.duration(moment(before).diff(after)).as('hours') > 30)
        throw new Error("TagUpdatesInTimeBlock limited to a one-day interval");
      
      // Get revisions to tags in the given time interval
      const tagRevisions = await Revisions.find({
        collectionName: "Tags",
        fieldName: "description",
        editedAt: {$lt: before, $gt: after},
        $or: [
          {"changeMetrics.added": {$gt: 0}},
          {"changeMetrics.removed": {$gt: 0}}
        ],
      }).fetch();
      
      // Get root comments on tags in the given time interval
      const rootComments = await Comments.find({
        deleted: false,
        postedAt: {$lt: before, $gt: after},
        topLevelCommentId: null,
        tagId: {$exists: true, $ne: null},
        tagCommentType: "DISCUSSION",
      }).fetch();
      
      const userIds = _.uniq([...tagRevisions.map(tr => tr.userId), ...rootComments.map(rc => rc.userId)])
      const usersAll = await loadByIds(context, "Users", userIds)
      const users = await accessFilterMultiple(context.currentUser, Users, usersAll, context)
      const usersById = keyBy(users, u => u._id);
      
      // Get the tags themselves
      const tagIds = _.uniq([...tagRevisions.map(r=>r.documentId), ...rootComments.map(c=>c.tagId)]);
      const tagsUnfiltered = await loadByIds(context, "Tags", tagIds);
      const tags = await accessFilterMultiple(context.currentUser, Tags, tagsUnfiltered, context);
      
      return tags.map(tag => {
        const relevantRevisions = _.filter(tagRevisions, rev=>rev.documentId===tag._id);
        const relevantRootComments = _.filter(rootComments, c=>c.tagId===tag._id);
        const relevantUsersIds = _.uniq([...relevantRevisions.map(tr => tr.userId), ...relevantRootComments.map(rc => rc.userId)]);
        const relevantUsers = _.map(relevantUsersIds, userId=>usersById[userId]);
        
        return {
          tag,
          revisionIds: _.map(relevantRevisions, r=>r._id),
          commentCount: relevantRootComments.length + sumBy(relevantRootComments, c=>c.descendentCount),
          commentIds: _.map(relevantRootComments, c=>c._id),
          lastRevisedAt: relevantRevisions.length>0 ? _.max(relevantRevisions, r=>r.editedAt).editedAt : null,
          lastCommentedAt: relevantRootComments.length>0 ? _.max(relevantRootComments, c=>c.lastSubthreadActivity).lastSubthreadActivity : null,
          added: sumBy(relevantRevisions, r=>r.changeMetrics.added),
          removed: sumBy(relevantRevisions, r=>r.changeMetrics.removed),
          users: relevantUsers,
        };
      });
    },
    
    async RandomTag(root: void, args: void, context: ResolverContext): Promise<DbTag> {
      const sample = await Tags.aggregate([
        {$match: {deleted: false, adminOnly: false}},
        {$sample: {size: 1}}
      ]).toArray();
      if (!sample || !sample.length)
        throw new Error("No tags found");
      return sample[0];
    },
    
    async TagUpdatesByUser(root: void, {userId,limit,skip}: {userId: string, limit: number, skip: number}, context: ResolverContext) {

      // Get revisions to tags
      const tagRevisions = await Revisions.find({
        collectionName: "Tags",
        fieldName: "description",
        userId,
        documentId: { $exists: true},
        $or: [
          {"changeMetrics.added": {$gt: 0}},
          {"changeMetrics.removed": {$gt: 0}}
        ],
      }, { limit, skip, sort: { editedAt: -1} }).fetch();

      // Get the tags themselves, keyed by the id
      const tagIds = _.uniq(tagRevisions.map(r=>r.documentId));
      const tagsUnfiltered = await loadByIds(context, "Tags", tagIds);
      const tags = (await accessFilterMultiple(context.currentUser, Tags, tagsUnfiltered, context)).reduce( (acc: Partial<Record<string,DbTag>>, tag: DbTag) => {
        acc[tag._id] = tag;
        return acc;
      }, {});

      // unlike TagUpdatesInTimeBlock we only return info on one revision per tag. i.e. we do not collect them by tag.
      return tagRevisions.map(rev => {
        const tag = tags[rev.documentId];
        return {
          tag,
          revisionIds: [rev._id],
          lastRevisedAt: rev.editedAt,
          added: rev.changeMetrics.added,
          removed: rev.changeMetrics.removed,
        };
      });
    }
  }
});

addGraphQLMutation('recordSubforumView(userId: String!, tagId: String!): String');
addGraphQLQuery('TagUpdatesInTimeBlock(before: Date!, after: Date!): [TagUpdates!]');
addGraphQLQuery('TagUpdatesByUser(userId: String!, limit: Int!, skip: Int!): [TagUpdates!]');
addGraphQLQuery('RandomTag: Tag!');

type ContributorWithStats = {
  user: DbUser,
  contributionScore: number,
  numCommits: number,
  voteCount: number,
};
type ContributorStats = {
  contributionScore: number,
  numCommits: number,
  voteCount: number,
};
type ContributorStatsList = Partial<Record<string,ContributorStats>>;

augmentFieldsDict(Tags, {
  contributors: augmentResolverOnlyField({
    graphqlArguments: 'limit: Int, version: String',
    graphQLtype: 'TagContributorsList',
    dependsOn: ['_id', 'contributionStats'],
    resolver: async (tag, {limit, version}: {limit?: number, version?: string}, context: ResolverContext): Promise<{
      contributors: ContributorWithStats[],
      totalCount: number,
    }> => {
      const contributionStatsByUserId = await getContributorsList(tag, version||null);
      const contributorUserIds = Object.keys(contributionStatsByUserId);
      const contributorUsersUnfiltered = await loadByIds(context, "Users", contributorUserIds);
      const contributorUsers = await accessFilterMultiple(context.currentUser, Users, contributorUsersUnfiltered, context);
      const usersById = keyBy(contributorUsers, u => u._id);

      const sortedContributors = orderBy(contributorUserIds, userId => -contributionStatsByUserId[userId]!.contributionScore);
      
      const topContributors: ContributorWithStats[] = sortedContributors.map(userId => ({
        user: usersById[userId],
        ...contributionStatsByUserId[userId]!,
      }));
      
      if (limit) {
        return {
          contributors: take(topContributors, limit),
          totalCount: topContributors.length,
        }
      } else {
        return {
          contributors: topContributors,
          totalCount: topContributors.length,
        }
      }
    }
  })
});

augmentFieldsDict(TagRels, {
  autoApplied: augmentResolverOnlyField({
    graphQLtype: 'Boolean',
    dependsOn: ['userId', 'voteCount'],
    resolver: async (document, args: void, context: ResolverContext) => {
      const tagBotUserId = await getTagBotUserId(context);
      if (!tagBotUserId) return false;
      return (document.userId===tagBotUserId && document.voteCount===1);
    }
  })
});

async function getContributorsList(tag: Pick<DbTag, '_id' | 'contributionStats'>, version: string|null): Promise<ContributorStatsList> {
  if (version)
    return await buildContributorsList(tag, version);
  else if (tag.contributionStats)
    return tag.contributionStats;
  else
    return await updateDenormalizedContributorsList(tag);
}

const getSelfVotes = async (tagRevisionIds: string[]): Promise<DbVote[]> => {
  if (Votes.isPostgres()) {
    const votesRepo = new VotesRepo();
    return votesRepo.getSelfVotes(tagRevisionIds);
  } else {
    const selfVotes = await Votes.aggregate([
      // All votes on relevant revisions
      { $match: {
        documentId: {$in: tagRevisionIds},
        collectionName: "Revisions",
        cancelled: false,
        isUnvote: false,
      }},
      // Filtered by: is a self-vote
      { $match: {
        $expr: {
          $in: ["$userId", "$authorIds"]
        }
      }}
    ]);
    return selfVotes.toArray();
  }
}

async function buildContributorsList(tag: Pick<DbTag, '_id'>, version: string|null): Promise<ContributorStatsList> {
  if (!(tag?._id))
    throw new Error("Invalid tag");
  
  const tagRevisions: DbRevision[] = await Revisions.find({
    collectionName: "Tags",
    fieldName: "description",
    documentId: tag._id,
    $or: [
      {"changeMetrics.added": {$gt: 0}},
      {"changeMetrics.removed": {$gt: 0}}
    ],
  }).fetch();
  
  const selfVotes = await getSelfVotes(tagRevisions.map(r=>r._id));
  const selfVotesByUser = groupBy(selfVotes, v=>v.userId);
  const selfVoteScoreAdjustmentByUser = mapValues(selfVotesByUser,
    selfVotes => {
      const totalSelfVotePower = sumBy(selfVotes, v=>v.power)
      const strongestSelfVote = _.max(selfVotes, v=>v.power)?.power
      const numSelfVotes = selfVotes.length;
      return {
        excludedPower: totalSelfVotePower - strongestSelfVote,
        excludedVoteCount: numSelfVotes>0 ? (numSelfVotes-1) : 0,
      };
    }
  );
  
  const filteredTagRevisions = version
    ? _.filter(tagRevisions, r=>compareVersionNumbers(version, r.version)>=0)
    : tagRevisions;
  
  const revisionsByUserId: Record<string,DbRevision[]> = groupBy(filteredTagRevisions, r=>r.userId);
  const contributorUserIds: string[] = Object.keys(revisionsByUserId);
  const contributionStatsByUserId: Partial<Record<string,ContributorStats>> = toDictionary(contributorUserIds,
    userId => userId,
    userId => {
      const revisionsByThisUser = filter(tagRevisions, r=>r.userId===userId);
      const totalRevisionScore = sumBy(revisionsByUserId[userId], r=>r.baseScore)||0
      const selfVoteAdjustment = selfVoteScoreAdjustmentByUser[userId]
      const excludedPower = selfVoteAdjustment?.excludedPower || 0;
      const excludedVoteCount = selfVoteAdjustment?.excludedVoteCount || 0;

      return {
        contributionScore: totalRevisionScore - excludedPower,
        numCommits: revisionsByThisUser.length,
        voteCount: sumBy(revisionsByThisUser, r=>r.voteCount ?? 0) - excludedVoteCount,
      };
    }
  );
  return contributionStatsByUserId;
}

export async function updateDenormalizedContributorsList(tag: Pick<DbTag, '_id' | 'contributionStats'>): Promise<ContributorStatsList> {
  const contributionStats = await buildContributorsList(tag, null);
  
  if (JSON.stringify(tag.contributionStats) !== JSON.stringify(contributionStats)) {
    await Tags.rawUpdateOne({_id: tag._id}, {$set: {
      contributionStats: contributionStats,
    }});
  }
  
  return contributionStats;
}
