import { addGraphQLResolvers, addGraphQLQuery } from 'meteor/vulcan:core';
import { Posts } from '../lib/collections/posts';
import { WeightedList } from './weightedList.js';

const scoreRelevantFields = {baseScore:1, curatedDate:1, frontpageDate:1};

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

const recommendablePostFilter = {
  ...Posts.getParameters({}).selector,
  
  // Only consider recommending posts if they have score>30. This has a big
  // effect on the size of the recommendable-post set, which needs to not be
  // too big for performance reasons.
  baseScore: {$gt: 30},
  
  // Don't recommend meta posts
  meta: false,
}

const topPosts = async ({count, currentUser, onlyUnread, scoreFn}) => {
  const unreadPostsMetadata = await Posts.aggregate([
    { $match: {
      ...recommendablePostFilter,
    } },
    
    ...(onlyUnread ? pipelineFilterUnread({currentUser}) : []),
    
    { $project: {_id:1, ...scoreRelevantFields} },
  ]).toArray();
  
  const unreadTopPosts = _.first(
    _.sortBy(unreadPostsMetadata, post => -scoreFn(post)),
    count);
  const unreadTopPostIds = _.map(unreadTopPosts, p=>p._id);
  
  return await Posts.find(
    { _id: {$in: unreadTopPostIds} },
    { sort: {baseScore: -1} }
  ).fetch();
}

const samplePosts = async ({count, currentUser, onlyUnread, sampleWeightFn}) => {
  const unreadPostsMetadata = await Posts.aggregate([
    { $match: {
      ...recommendablePostFilter,
    } },
    
    ...(onlyUnread ? pipelineFilterUnread({currentUser}) : []),
    
    { $project: {_id:1, ...scoreRelevantFields} },
  ]).toArray();
  
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
      return getRecommendations({count, algorithm, currentUser})
    }
  }
});

addGraphQLQuery("Recommendations(count: Int, algorithm: JSON): [Post!]");
