import { addGraphQLResolvers, addGraphQLQuery, addGraphQLSchema } from '../../lib/vulcan-lib/graphql';
import { Comments } from '../../lib/collections/comments/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import { Tags } from '../../lib/collections/tags/collection';
import { addFieldsDict } from '../../lib/utils/schemaUtils';
import moment from 'moment';
import sumBy from 'lodash/sumBy';
import groupBy from 'lodash/groupBy';
import keyBy from 'lodash/keyBy';
import orderBy from 'lodash/orderBy';
import { toDictionary } from '../../lib/utils/toDictionary';
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
      arguments: 'limit: Int',
      type: "[TagContributor!]",
      resolver: async (tag: DbTag, {limit}: {limit?: number}, context: ResolverContext) => {
        // TODO: When computing contribution score, only count the user's
        // self-vote power once, rather than once per contributed revision.
        // TODO: Use the limit argument.
        // TODO: Maybe denormalize this into a whole collection, for performance.
        // Fetching all the revs on a tag is potentially very expensive, if the
        // tag has a long history.
        
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
        
        const revisionsByUserId: Record<string,DbRevision[]> = groupBy(tagRevisions, r=>r.userId);
        const contributorUserIds: string[] = Object.keys(revisionsByUserId);
        const usersById = keyBy(await context.loaders.Users.loadMany(contributorUserIds), u => u._id);
        const contributionScoresByUserId: Partial<Record<string,number>> = toDictionary(contributorUserIds,
          userId=>userId, userId => sumBy(revisionsByUserId[userId], r=>r.baseScore)||0);
        const sortedContributors = orderBy(contributorUserIds, userId => -(contributionScoresByUserId[userId] || 0));
        
        const topContributors = sortedContributors.map(userId => ({
          user: usersById[userId],
          contributionScore: contributionScoresByUserId[userId],
        }))
        return topContributors;
      }
    }
  },
});
