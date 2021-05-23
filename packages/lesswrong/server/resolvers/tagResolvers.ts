import { addGraphQLResolvers, addGraphQLQuery, addGraphQLSchema } from '../../lib/vulcan-lib/graphql';
import { Comments } from '../../lib/collections/comments/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import { Tags } from '../../lib/collections/tags/collection';
import { Votes } from '../../lib/collections/votes/collection';
import { addFieldsDict } from '../../lib/utils/schemaUtils';
import { compareVersionNumbers } from '../../lib/editor/utils';
import { annotateAuthors } from '../attributeEdits';
import moment from 'moment';
import sumBy from 'lodash/sumBy';
import groupBy from 'lodash/groupBy';
import keyBy from 'lodash/keyBy';
import orderBy from 'lodash/orderBy';
import mapValues from 'lodash/mapValues';
import { toDictionary } from '../../lib/utils/toDictionary';
import take from 'lodash/take';
import * as _ from 'underscore';

addGraphQLSchema(`
  type TagUpdatesTimeBlock {
    tag: Tag!
    revisionIds: [String!]
    commentCount: Int
    commentIds: [String!]
    lastRevisedAt: Date
    lastCommentedAt: Date
    added: Int
    removed: Int
  }
`);

addGraphQLResolvers({
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
      }).fetch();
      
      // Get the tags themselves
      const tagIds = _.uniq([...tagRevisions.map(r=>r.documentId), ...rootComments.map(c=>c.tagId)]);
      const tags = await context.loaders.Tags.loadMany(tagIds);
      
      return tags.map(tag => {
        const relevantRevisions = _.filter(tagRevisions, rev=>rev.documentId===tag._id);
        const relevantRootComments = _.filter(rootComments, c=>c.tagId===tag._id);
        
        return {
          tag,
          revisionIds: _.map(relevantRevisions, r=>r._id),
          commentCount: relevantRootComments.length + sumBy(relevantRootComments, c=>c.descendentCount),
          commentIds: _.map(relevantRootComments, c=>c._id),
          lastRevisedAt: relevantRevisions.length>0 ? _.max(relevantRevisions, r=>r.editedAt).editedAt : null,
          lastCommentedAt: relevantRootComments.length>0 ? _.max(relevantRootComments, c=>c.lastSubthreadActivity).lastSubthreadActivity : null,
          added: sumBy(relevantRevisions, r=>r.changeMetrics.added),
          removed: sumBy(relevantRevisions, r=>r.changeMetrics.removed),
        };
      });
    }
  }
});

addGraphQLQuery('TagUpdatesInTimeBlock(before: Date!, after: Date!): [TagUpdatesTimeBlock!]');

addFieldsDict(Tags, {
  contributors: {
    resolveAs: {
      arguments: 'limit: Int, version: String',
      type: "TagContributorsList",
      resolver: async (tag: DbTag, {limit, version}: {limit?: number, version?: string}, context: ResolverContext) => {
        const contributionScoresByUserId = await getContributorsList(tag, version||null, context);
        const contributorUserIds = Object.keys(contributionScoresByUserId);
        const usersById = keyBy(await context.loaders.Users.loadMany(contributorUserIds), u => u._id);
  
        const sortedContributors = orderBy(contributorUserIds, userId => -(contributionScoresByUserId[userId] || 0));
        
        const topContributors = sortedContributors.map(userId => ({
          user: usersById[userId],
          contributionScore: contributionScoresByUserId[userId],
        }))
        
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
});

async function getContributorsList(tag: DbTag, version: string|null, context: ResolverContext) {
  if (version)
    return await buildContributorsList(tag, version);
  else if (tag.contributionScores)
    return tag.contributionScores;
  else
    return await updateDenormalizedContributorsList(tag);
}

async function buildContributorsList(tag: DbTag, version: string|null) {
  // TODO: When computing contribution score, only count the user's
  // self-vote power once, rather than once per contributed revision.
  
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
  
  const selfVotes = await Votes.aggregate([
    // All votes on relevant revisions
    { $match: {
      documentId: {$in: tagRevisions.map(r=>r._id)},
      collectionName: "Revisions",
      cancelled: false,
      isUnvote: false,
    }},
    // Filtered by: is a self-vote
    { $match: {
      $expr: {
        $eq: ["$userId", "$authorId"]
      }
    }}
  ]).toArray();
  const selfVotesByUser = groupBy(selfVotes, v=>v.userId);
  const selfVoteScoreAdjustmentByUser = mapValues(selfVotesByUser,
    selfVotes => {
      const totalSelfVotePower = sumBy(selfVotes, v=>v.power)
      const strongestSelfVote = _.max(selfVotes, v=>v.power).power
      return totalSelfVotePower - strongestSelfVote;
    }
  );
  
  const filteredTagRevisions = version
    ? _.filter(tagRevisions, r=>compareVersionNumbers(version, r.version)>=0)
    : tagRevisions;
  
  const revisionsByUserId: Record<string,DbRevision[]> = groupBy(filteredTagRevisions, r=>r.userId);
  const contributorUserIds: string[] = Object.keys(revisionsByUserId);
  const contributionScoresByUserId: Partial<Record<string,number>> = toDictionary(contributorUserIds,
    userId=>userId, userId => {
      const totalRevisionScore = sumBy(revisionsByUserId[userId], r=>r.baseScore)||0
      const selfVoteAdjustment = selfVoteScoreAdjustmentByUser[userId]||0;
      return totalRevisionScore - selfVoteAdjustment;
    });
  return contributionScoresByUserId;
}

export async function updateDenormalizedContributorsList(tag: DbTag) {
  const contributionScores = await buildContributorsList(tag, null);
  
  if (JSON.stringify(tag.contributionScores) !== JSON.stringify(contributionScores)) {
    await Tags.update({_id: tag._id}, {$set: {
      contributionScores: contributionScores,
    }});
  }
  
  return contributionScores;
}

export async function updateDenormalizedHtmlAttributions(tag: DbTag) {
  const html = await annotateAuthors(tag._id, "Tags", "description");
  await Tags.update({_id: tag._id}, {$set: {
    htmlWithContributorAnnotations: html,
  }});
  return html;
}

