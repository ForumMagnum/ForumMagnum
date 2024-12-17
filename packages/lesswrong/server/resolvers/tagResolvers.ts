import { addGraphQLResolvers, addGraphQLQuery, addGraphQLSchema, addGraphQLMutation } from '../../lib/vulcan-lib/graphql';
import { mergeFeedQueries, defineFeedResolver, viewBasedSubquery, SubquerySortField, SortDirection } from '../utils/feedUtil';
import { Comments } from '../../lib/collections/comments/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import { Tags } from '../../lib/collections/tags/collection';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { Users } from '../../lib/collections/users/collection';
import { Posts } from '../../lib/collections/posts';
import { augmentFieldsDict, accessFilterMultiple, accessFilterSingle } from '../../lib/utils/schemaUtils';
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
import { VotesRepo, TagsRepo } from '../repos';
import { getTagBotUserId } from '../languageModels/autoTagCallbacks';
import { filterNonnull, filterWhereFieldsNotNull } from '../../lib/utils/typeGuardUtils';
import { defineQuery } from '../utils/serverGraphqlUtil';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { taggingNamePluralSetting } from '../../lib/instanceSettings';
import difference from 'lodash/difference';
import { updatePostDenormalizedTags } from '../tagging/helpers';
import union from 'lodash/fp/union';
import { updateMutator } from '../vulcan-lib';
import { captureException } from '@sentry/core';
import GraphQLJSON from 'graphql-type-json';
import { getToCforTag } from '../tableOfContents';

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

const createSubforumFeedResolver = <SortKeyType extends number | Date>(sorting: SubforumFeedSort) => async ({
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

async function getRevisionAndCommentUsers(revisions: DbRevision[], rootComments: DbComment[], context: ResolverContext) {
  const revisionUserIds = revisions.map(tr => tr.userId);
  const commentUserIds = rootComments.map(rc => rc.userId);
  const userIds = filterNonnull(_.uniq([...revisionUserIds, ...commentUserIds]));

  const usersAll = await loadByIds(context, "Users", userIds);
  const users = await accessFilterMultiple(context.currentUser, Users, usersAll, context);

  return keyBy(users, u => u._id);
}

async function getMultiDocumentsByTagId(revisions: DbRevision[], context: ResolverContext) {
  const { MultiDocuments } = context;

  const revisionMultiDocumentIds = revisions.filter(r=>r.collectionName==="MultiDocuments").map(r=>r.documentId);
  const multiDocumentIds = filterNonnull(_.uniq(revisionMultiDocumentIds));

  const multiDocumentsUnfiltered = await loadByIds(context, "MultiDocuments", multiDocumentIds);
  const multiDocuments = await accessFilterMultiple(context.currentUser, MultiDocuments, multiDocumentsUnfiltered, context);

  const lenses = multiDocuments.filter(md=>md.fieldName === "description" && md.collectionName === "Tags");
  const summaries = multiDocuments.filter(md=>md.fieldName === "summary");

  const lensesByTagId = groupBy(lenses, md => md.parentDocumentId);
  const summariesByTagId = groupBy(summaries, md => md.parentDocumentId);

  const lensIdsByTagId = mapValues(lensesByTagId, lenses => lenses.map(l => l._id!));
  const summaryIdsByTagId = mapValues(summariesByTagId, summaries => summaries.map(s => s._id!));

  return { lensIdsByTagId, summaryIdsByTagId };
}

async function getTopLevelTags(revisions: DbRevision[], rootComments: DbComment[], lensIdsByTagId: Record<string, string[]>, summaryIdsByTagId: Record<string, string[]>, context: ResolverContext) {
  const revisionTagIds = revisions.filter(r=>r.collectionName==="Tags").map(r=>r.documentId);
  const commentTagIds = rootComments.map(c=>c.tagId);
  const tagIds = [...revisionTagIds, ...commentTagIds];
  const lensTagIds = Object.keys(lensIdsByTagId);
  const summaryTagIds = Object.keys(summaryIdsByTagId);
  const topLevelTagIds = filterNonnull(_.uniq([...tagIds, ...lensTagIds, ...summaryTagIds]));

  const tagsUnfiltered = await loadByIds(context, "Tags", topLevelTagIds);
  return await accessFilterMultiple(context.currentUser, Tags, tagsUnfiltered, context);
}

addGraphQLResolvers({
  Mutation: {
    async mergeTags(
      root: void,
      {
        sourceTagId,
        targetTagId,
        transferSubtags,
        redirectSource,
      }: { sourceTagId: string; targetTagId: string; transferSubtags: boolean; redirectSource: boolean },
      context: ResolverContext
    ) {
      const { currentUser } = context;

      if (!userIsAdminOrMod(currentUser)) {
        throw new Error(`Must be an admin/mod to merge ${taggingNamePluralSetting.get()}`);
      }
      if (!sourceTagId || !targetTagId) {
        throw new Error("sourceTagId and targetTagId required");
      }

      const sourceTag = await Tags.findOne({ _id: sourceTagId });
      const targetTag = await Tags.findOne({ _id: targetTagId });

      if (!sourceTag) {
        throw new Error(`Could not find source tag with _id: ${sourceTagId}`);
      }
      if (!targetTag) {
        throw new Error(`Could not find target tag with _id: ${targetTagId}`);
      }

      //
      // Transfer posts
      //
      // 1. To preserve the source of the votes, just update the tagId of the TagRels for posts where the source tag is added but not the target
      // 2. For posts where both the source and target are already added, soft delete the source TagRel
      //
      // Note that for both of these we don't distinguish between positive and negative votes, so if a post has the source tag downvoted (hence unapplied)
      // this downvote will be copied over to the target

      const sourceTagRels = await TagRels.find({tagId: sourceTagId, deleted: false}).fetch()
      const targetTagRels = await TagRels.find({tagId: targetTagId, deleted: false}).fetch()

      const sourcePostIds = sourceTagRels.map(tr => tr.postId)
      const targetPostIds = targetTagRels.map(tr => tr.postId)

      const sourceOnlyPostIds = difference(sourcePostIds, targetPostIds);
      const sourceAndTargetPostIds = difference(sourcePostIds, sourceOnlyPostIds)

      // Transfer TagRels for posts with only the source tag
      await TagRels.rawUpdateMany(
        { tagId: sourceTagId, postId: { $in: sourceOnlyPostIds } },
        { $set: { tagId: targetTagId } },
        { multi: true }
      );
      // TODO: This is fragile, once denormalizedCountOfReferences can do full recalulations
      // make it use that (pending https://app.asana.com/0/628521446211730/1206130592328269/f)
      await Tags.rawUpdateOne(sourceTag._id, { $inc: {postCount: -sourceOnlyPostIds.length}})
      await Tags.rawUpdateOne(targetTag._id, { $inc: {postCount: sourceOnlyPostIds.length}})

      // Soft delete TagRels for posts with both the source and target tag, note that the corresponding votes don't need to be deleted
      await TagRels.rawUpdateMany(
        { tagId: sourceTagId, postId: { $in: sourceAndTargetPostIds } },
        { $set: { deleted: true } },
        { multi: true }
      );
      await Tags.rawUpdateOne(sourceTag._id, { $inc: {postCount: -sourceAndTargetPostIds.length}})

      // Call updatePostDenormalizedTags(postId) for all (unique) posts in sourcePostIds, targetPostIds
      const uniquePostIds = union(sourceOnlyPostIds, sourceAndTargetPostIds);
      const updateDenormalizedTags = async () => {
        for (const postId of uniquePostIds) {
          try {
            await updatePostDenormalizedTags(postId)
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e)
          }
        }
      }
      // Don't await this, because it might cause a timeout
      void updateDenormalizedTags();

      //
      // Transfer sub-tags
      //
      if (transferSubtags) {
        const sourceSubTags = await Tags.find({ parentTagId: sourceTagId }).fetch()

        for (const subTag of sourceSubTags) {
          await updateMutator({
            collection: Tags,
            documentId: subTag._id,
            // This will run a callback to update the subTags field on the parent tag
            set: { parentTagId: targetTagId },
            validate: false,
          });
        }
      }

      //
      // Soft delete source and redirect
      //
      if (redirectSource) {
        const originalSourceSlug = sourceTag.slug;
        const deletedSourceSlug = `${originalSourceSlug}-deleted`;

        // Update the source slug as a raw update so the original doesn't get added to `oldSlugs`
        await Tags.rawUpdateOne({ _id: sourceTagId }, { $set: { slug: deletedSourceSlug } });
        // Update oldSlugs on the target so requests for the original source tag redirect to the target
        await Tags.rawUpdateOne(
          { _id: targetTagId },
          {
            $addToSet: {
              oldSlugs: originalSourceSlug,
            },
          }
        );

        // Soft delete the source tag, making sure to run the callbacks
        await updateMutator({
          collection: Tags,
          documentId: sourceTagId,
          set: { deleted: true },
          validate: false,
        });
      }

      return true;
    },
  },
  Query: {
    async TagUpdatesInTimeBlock(root: void, {before,after}: {before: Date, after: Date}, context: ResolverContext) {
      if (!before) throw new Error("Missing graphql parameter: before");
      if (!after) throw new Error("Missing graphql parameter: after");
      if(moment.duration(moment(before).diff(after)).as('hours') > 30)
        throw new Error("TagUpdatesInTimeBlock limited to a one-day interval");
      
      // Get revisions to tags in the given time interval
      const revisions = await Revisions.find({
        $and: [{
          $or: [
            { collectionName: "Tags", fieldName: "description" },
            { collectionName: "MultiDocuments", fieldName: "contents" },
          ],
        }, {
          $or: [
            { "changeMetrics.added": {$gt: 0} },
            { "changeMetrics.removed": {$gt: 0} }
          ]
        }],
        editedAt: { $lt: before, $gt: after },
      }).fetch();
      
      // Get root comments on tags in the given time interval
      const rootComments = await Comments.find({
        deleted: false,
        postedAt: {$lt: before, $gt: after},
        topLevelCommentId: null,
        tagId: {$exists: true, $ne: null},
        tagCommentType: "DISCUSSION",
      }).fetch();
      
      const [usersById, { lensIdsByTagId, summaryIdsByTagId }] = await Promise.all([
        getRevisionAndCommentUsers(revisions, rootComments, context),
        getMultiDocumentsByTagId(revisions, context),
      ]);

      const tags = await getTopLevelTags(revisions, rootComments, lensIdsByTagId, summaryIdsByTagId, context);

      return tags.map(tag => {
        const relevantTagRevisions = revisions.filter(rev=>rev.documentId===tag._id);
        const relevantLensRevisions = revisions.filter(rev=>lensIdsByTagId[tag._id!]?.includes(rev.documentId!));
        const relevantSummaryRevisions = revisions.filter(rev=>summaryIdsByTagId[tag._id!]?.includes(rev.documentId!));
        const relevantRevisions = [...relevantTagRevisions, ...relevantLensRevisions, ...relevantSummaryRevisions];

        const relevantRootComments = rootComments.filter(c=>c.tagId===tag._id);
        const relevantUsersIds = filterNonnull(_.uniq([...relevantTagRevisions.map(tr => tr.userId), ...relevantRootComments.map(rc => rc.userId)]));
        const relevantUsers = relevantUsersIds.map(userId=>usersById[userId]);
        
        return {
          tag,
          revisionIds: relevantRevisions.map(r=>r._id),
          commentCount: relevantRootComments.length + sumBy(relevantRootComments, c=>c.descendentCount),
          commentIds: relevantRootComments.map(c=>c._id),
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
      const rawTagRevisions = await Revisions.find({
        collectionName: "Tags",
        fieldName: "description",
        userId,
        documentId: { $exists: true},
        $or: [
          {"changeMetrics.added": {$gt: 0}},
          {"changeMetrics.removed": {$gt: 0}}
        ],
      }, { limit, skip, sort: { editedAt: -1} }).fetch();

      const tagRevisions = filterWhereFieldsNotNull(rawTagRevisions, "documentId")

      // Get the tags themselves, keyed by the id
      const tagIds = filterNonnull(_.uniq(tagRevisions.map(r=>r.documentId)))
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
    },

    ActiveTagCount: () => Tags.find({deleted: {$ne: true}}).count(),
  }
});

addGraphQLMutation('mergeTags(sourceTagId: String!, targetTagId: String!, transferSubtags: Boolean!, redirectSource: Boolean!): Boolean');
addGraphQLQuery('TagUpdatesInTimeBlock(before: Date!, after: Date!): [TagUpdates!]');
addGraphQLQuery('TagUpdatesByUser(userId: String!, limit: Int!, skip: Int!): [TagUpdates!]');
addGraphQLQuery('RandomTag: Tag!');
addGraphQLQuery('ActiveTagCount: Int!');

defineQuery({
  name: "TagPreview",
  schema: `
    type TagPreviewWithSummaries {
      tag: Tag!
      summaries: [MultiDocument!]!
    }
  `,
  resultType: "TagPreviewWithSummaries",
  argTypes: "(slug: String!, hash: String)",
  fn: async (root, { slug, hash }: { slug: string, hash: string | null }, context) => {
    const { Tags, MultiDocuments, repos, currentUser } = context;

    const tagWithSummaries = await repos.tags.getTagWithSummaries(slug);

    if (!tagWithSummaries) return null;

    const { summaries, ...tag } = tagWithSummaries;

    const [filteredTag, filteredSummaries] = await Promise.all([
      accessFilterSingle(currentUser, Tags, tag, context),
      accessFilterMultiple(currentUser, MultiDocuments, summaries, context)
    ]);

    if (!filteredTag) return null;

    return {
      tag: filteredTag,
      summaries: filteredSummaries,
    };
  },
});

type ContributorWithStats = {
  user: Partial<DbUser>,
  contributionScore: number,
  contributionVolume: number,
  numCommits: number,
  voteCount: number,
};
type ContributorStats = {
  contributionScore: number,
  contributionVolume: number,
  numCommits: number,
  voteCount: number,
};
type ContributorStatsList = Partial<Record<string,ContributorStats>>;

augmentFieldsDict(Tags, {
  contributors: {
    resolveAs: {
      arguments: 'limit: Int, version: String',
      type: "TagContributorsList",
      resolver: async (tag: DbTag, {limit, version}: {limit?: number, version?: string}, context: ResolverContext): Promise<{
        contributors: ContributorWithStats[],
        totalCount: number,
      }> => {
        const contributionStatsByUserId = await getContributorsList(tag, version||null);
        const contributorUserIds = Object.keys(contributionStatsByUserId);
        const contributorUsersUnfiltered = await loadByIds(context, "Users", contributorUserIds);
        const contributorUsers = await accessFilterMultiple(context.currentUser, Users, contributorUsersUnfiltered, context);
        const usersById = keyBy(contributorUsers, u => u._id) as Record<string, Partial<DbUser>>;
  
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
    }
  },
  tableOfContents: {
    resolveAs: {
      arguments: 'version: String',
      type: GraphQLJSON,
      resolver: async (document: DbTag, args: {version: string}, context: ResolverContext) => {
        try {
          return await getToCforTag({document, version: args.version||null, context});
        } catch(e) {
          captureException(e);
          return null;
        }
      }
    },
  },
});

augmentFieldsDict(TagRels, {
  autoApplied: {
    resolveAs: {
      type: "Boolean!",
      resolver: async (document: DbTagRel, args: void, context: ResolverContext) => {
        const tagBotUserId = await getTagBotUserId(context);
        if (!tagBotUserId) return false;
        return (document.userId===tagBotUserId && document.voteCount===1);
      },
    },
  },
});

async function getContributorsList(tag: DbTag, version: string|null): Promise<ContributorStatsList> {
  if (version)
    return await buildContributorsList(tag, version);
  else if (tag.contributionStats && Object.values(tag.contributionStats).some(({ contributionVolume }: ContributorStats) => contributionVolume))
    return tag.contributionStats;
  else
    return await updateDenormalizedContributorsList(tag);
}

async function buildContributorsList(tag: DbTag, version: string|null): Promise<ContributorStatsList> {
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
  
  const selfVotes = await new VotesRepo().getSelfVotes(tagRevisions.map(r => r._id));
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
      const contributionVolume = sumBy(revisionsByThisUser, r=>r.changeMetrics.added + r.changeMetrics.removed);

      return {
        contributionScore: totalRevisionScore - excludedPower,
        numCommits: revisionsByThisUser.length,
        voteCount: sumBy(revisionsByThisUser, r=>r.voteCount ?? 0) - excludedVoteCount,
        contributionVolume,
      };
    }
  );
  return contributionStatsByUserId;
}

export async function updateDenormalizedContributorsList(tag: DbTag): Promise<ContributorStatsList> {
  const contributionStats = await buildContributorsList(tag, null);
  
  if (JSON.stringify(tag.contributionStats) !== JSON.stringify(contributionStats)) {
    await Tags.rawUpdateOne({_id: tag._id}, {$set: {
      contributionStats: contributionStats,
    }});
  }
  
  return contributionStats;
}

interface AllTagsPageCache {
  tags: DbTag[];
  lastUpdatedAt: Date;
}

const ALL_TAGS_PAGE_CACHE: AllTagsPageCache = {
  tags: [],
  lastUpdatedAt: new Date(0),
};

async function updateAllTagsPageCache(context: ResolverContext) {
  const tags = await context.repos.tags.getAllTagsForCache();
  ALL_TAGS_PAGE_CACHE.tags = tags;
  ALL_TAGS_PAGE_CACHE.lastUpdatedAt = new Date();
}

defineQuery({
  name: "AllTags",
  resultType: "[Tag!]!",
  fn: async (root, args, context) => {
    if (moment(ALL_TAGS_PAGE_CACHE.lastUpdatedAt).isBefore(moment(new Date()).subtract(1, 'hour'))) {
      await updateAllTagsPageCache(context);
    }
    return ALL_TAGS_PAGE_CACHE.tags;
  },
});
