import * as _ from 'underscore';
import { Posts } from '../lib/collections/posts/collection';
import { Sequences } from '../lib/collections/sequences/collection';
import { Collections } from '../lib/collections/collections/collection';
import { ensureIndex } from '../lib/collectionUtils';
import { accessFilterSingle, accessFilterMultiple } from '../lib/utils/schemaUtils';
import { setUserPartiallyReadSequences } from './partiallyReadSequences';
import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from './vulcan-lib';
import { WeightedList } from './weightedList';
import type { RecommendationsAlgorithm } from '../lib/collections/users/recommendationSettings';
import { forumTypeSetting } from '../lib/instanceSettings';
import { RecommendedSequencesAlgorithm } from '../components/recommendations/withRecommendedSequences';

/**
 * Returns all curated sequences, stripping away all information except their _id and curatedOrder
 */
const allRecommendableSequences = async (): Promise<Array<DbSequence>> => {
  return await Sequences.aggregate([
    // Filter to recommendable sequences
    { $match: {
      curatedOrder: {$gt: 0}
    } },
    // Project out fields other than _id and scoreRelevantFields
    { $project: {_id:1, curatedOrder: 1} },
  ]).toArray();
}

const sampleSequences = async ({count}: {
  count: number
}) => {
  const recommendableSequencesMetadata  = await allRecommendableSequences();
  console.log("recommendableSequencesMetadata", recommendableSequencesMetadata)

  const numSequencesToReturn = Math.max(0, Math.min(recommendableSequencesMetadata.length, count))

  const sampledSequences = new WeightedList(
    _.map(recommendableSequencesMetadata, sequence => [sequence._id, sequence.curatedOrder])
  ).pop(Math.max(numSequencesToReturn, 0))

  console.log("sampledSequences", sampledSequences)

  const recommendedSequences = _.first(sampledSequences, numSequencesToReturn)

  return await Sequences.find(
    { _id: {$in: recommendedSequences} }
  ).fetch();
}

addGraphQLResolvers({
  Query: {
    async RecommendedSequences(root: void, {count}: {count: number}, context: ResolverContext) {
      const { currentUser } = context;
      const recommendedSequences = await sampleSequences({count})
      const accessFilteredSequences = await accessFilterMultiple(currentUser, Sequences, recommendedSequences, context);
      if (recommendedSequences.length !== accessFilteredSequences.length) {
        // eslint-disable-next-line no-console
        console.error("Recommendation engine returned a sequence which permissions filtered out as inaccessible");
      }
      return accessFilteredSequences;
    }
  }
});

addGraphQLQuery("RecommendedSequences(count: Int): [Sequence!]");




