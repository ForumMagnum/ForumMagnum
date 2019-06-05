import { addGraphQLResolvers, addGraphQLQuery } from 'meteor/vulcan:core';
import { Posts } from '../lib/collections/posts';
import { WeightedList } from './weightedList.js';
import { accessFilterMultiple } from '../lib/modules/utils/schemaUtils.js';

const MINIMUM_BASE_SCORE = 50

// The set of fields on Posts which are used for deciding which posts to
// recommend. Fields other than these will be projected out before downloading
// from the database.
const scoreRelevantFields = {baseScore:1, curatedDate:1, frontpageDate:1};


// Returns part of a mongodb aggregate pipeline, which will join against the
// LWEvents collection and filter out any posts which have a corresponding
// post-view event for the current user. Returns as an array, so you can spread
// this into a pipeline with ...pipelineFilterUnread(currentUser). If
// currentUser is null, returns an empty array (no aggregation pipeline stages),
// so all posts are included.
const pipelineFilterUnread = ({currentUser}) => {
  if (!currentUser)
    return [];
  
  return [
    { $lookup: {
      from: "lwevents",
      let: { documentId: "$_id", },
      pipeline: [
        { $match: {
          name: "post-view",
          userId: currentUser._id,
        } },
        { $match: { $expr: {
          $and: [
            {$eq: ["$documentId", "$$documentId"]},
          ]
        } } },
        { $limit: 1},
      ],
      as: "views",
    } },
    
    { $match: {
      "views": {$size:0}
    } },
  ];
}

// A filter (mongodb selector) for which posts should be considered at all as
// recommendations.
const recommendablePostFilter = {
  // Gets the selector from the default Posts view, which includes things like
  // excluding drafts and deleted posts
  ...Posts.getParameters({}).selector,
  
  // Only consider recommending posts if they hit the minimum base score. This has a big
  // effect on the size of the recommendable-post set, which needs to not be
  // too big for performance reasons.
  baseScore: {$gt: MINIMUM_BASE_SCORE},
  
  // Don't recommend meta posts
  meta: false,
  
  // Enforce the disableRecommendation flag
  disableRecommendation: {$ne: true},
}

// Return the set of all posts that are eligible for being recommended, with
// scoreRelevantFields included (but other fields projected away). If
// onlyUnread is true and currentUser is nonnull, posts that the user has
// already read are filtered out.
const allRecommendablePosts = async ({currentUser, onlyUnread}) => {
  return await Posts.aggregate([
    // Filter to recommendable posts
    { $match: {
      ...recommendablePostFilter,
    } },
    
    // If onlyUnread, filter to just unread posts
    ...(onlyUnread ? pipelineFilterUnread({currentUser}) : []),
    
    // Project out fields other than _id and scoreRelevantFields
    { $project: {_id:1, ...scoreRelevantFields} },
  ]).toArray();
}

// Returns the top-rated posts (rated by scoreFn) to recommend to a user.
//   count: The maximum number of posts to return. May return fewer, if there
//     aren't enough recommendable unread posts in the database.
//   currentUser: The user who is requesting the recommendations, or null if
//     logged out.
//   onlyUnread: Whether to exclude posts which currentUser has already read.
//   scoreFn: Function which takes a post (with at least scoreRelevantFields
//     included), and returns a number. The posts with the highest scoreFn
//     return value will be the ones returned.
const topPosts = async ({count, currentUser, onlyUnread, scoreFn}) => {
  const unreadPostsMetadata  = await allRecommendablePosts({currentUser, onlyUnread});
  
  const unreadTopPosts = _.first(
    _.sortBy(unreadPostsMetadata, post => -scoreFn(post)),
    count);
  const unreadTopPostIds = _.map(unreadTopPosts, p=>p._id);
  
  return await Posts.find(
    { _id: {$in: unreadTopPostIds} },
    { sort: {baseScore: -1} }
  ).fetch();
}

// Returns a random weighted sampling of highly-rated posts (weighted by
// sampleWeightFn) to recommend to a user.
//   count: The maximum number of posts to return. May return fewer, if there
//     aren't enough recommendable unread posts in the database.
//   currentUser: The user who is requesting the recommendations, or null if
//     logged out.
//   onlyUnread: Whether to exclude posts which currentUser has already read.
//   sampleWeightFn: Function which takes a post (with at least
//     scoreRelevantFields included), and returns a number. Higher numbers are
//     more likely to be recommended.
const samplePosts = async ({count, currentUser, onlyUnread, sampleWeightFn}) => {
  const unreadPostsMetadata  = await allRecommendablePosts({currentUser, onlyUnread});
  
  const sampledPosts = new WeightedList(
    _.map(unreadPostsMetadata, post => [post._id, sampleWeightFn(post)])
  ).pop(count);
  
  return await Posts.find(
    { _id: {$in: sampledPosts} },
  ).fetch();
}

const getRecommendations = async ({count, algorithm, currentUser}) => {
  const scoreFn = post => {
    const sectionModifier = post.curatedDate
      ? algorithm.curatedModifier
      : (post.frontpageDate
        ? algorithm.frontpageModifier
        : algorithm.personalBlogpostModifier);
    const weight = sectionModifier + Math.pow(post.baseScore - algorithm.scoreOffset, algorithm.scoreExponent)
    return Math.max(0, weight);
  }
  
  // Cases here should match recommendationAlgorithms in RecommendationsAlgorithmPicker.jsx
  switch(algorithm.method) {
    case "top": {
      return await topPosts({
        count, currentUser,
        onlyUnread: algorithm.onlyUnread,
        scoreFn
      });
    }
    case "sample": {
      return await samplePosts({
        count, currentUser,
        onlyUnread: algorithm.onlyUnread,
        sampleWeightFn: scoreFn,
      });
    }
    default: {
      throw new Error(`Unrecognized recommendation algorithm: ${algorithm.method}`);
    }
  }
};

addGraphQLResolvers({
  Query: {
    async Recommendations(root, {count,algorithm}, {currentUser}) {
      const recommended = await getRecommendations({count, algorithm, currentUser})
      const accessFiltered = accessFilterMultiple(currentUser, Posts, recommended);
      if (recommended.length !== accessFiltered.length) {
        // eslint-disable-next-line no-console
        console.error("Recommendation engine returned a post which permissions filtered out as inaccessible");
      }
      return accessFiltered;
    }
  }
});

addGraphQLQuery("Recommendations(count: Int, algorithm: JSON): [Post!]");
