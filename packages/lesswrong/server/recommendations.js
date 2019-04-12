import { addGraphQLResolvers, addGraphQLQuery } from 'meteor/vulcan:core';
import { Posts } from '../lib/collections/posts';
import { WeightedList } from './weightedList.js';

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

const defaultViewPostFilter = {
  status: Posts.config.STATUS_APPROVED,
  isFuture: false,
  draft: false,
  unlisted: false,
  authorIsUnreviewed: false,
  groupId: {$exists: false},
};

const recommendablePostFilter = {
  ...defaultViewPostFilter,
  
  // Only consider recommending posts if they have score>30. This has a big
  // effect on the size of the recommendable-post set, which needs to not be
  // too big for performance reasons.
  baseScore: {$gt: 30},
  
  // Don't recommend meta posts
  meta: false,
}

const topUnreadPosts = async ({count, currentUser}) => {
  const unreadTopPostsMetadata = await Posts.aggregate([
    { $match: {
      ...recommendablePostFilter,
    } },
    { $project: {_id:1, baseScore:1} },
    { $sort: {baseScore:-1} },
    
    ...pipelineFilterUnread({currentUser}),
    
    { $project: {_id:1} },
    { $limit: count }
  ]).toArray();
  
  const unreadTopPostIds = _.map(unreadTopPostsMetadata, p=>p._id);
  return await Posts.find(
    { _id: {$in: unreadTopPostIds} },
    { sort: {baseScore: -1} }
  ).fetch();
}

const sampleUnreadPosts = async ({count, currentUser, sampleWeightFn}) => {
  const unreadPostsMetadata = await Posts.aggregate([
    { $match: {
      ...recommendablePostFilter,
    } },
    
    ...pipelineFilterUnread({currentUser}),
    
    { $project: {_id:1, baseScore:1} },
  ]).toArray();
  
  const sampledPosts = new WeightedList(
    _.map(unreadPostsMetadata, post => [post._id, Math.pow(post.baseScore, 2)])
  ).pop(count);
  
  return await Posts.find(
    { _id: {$in: sampledPosts} },
  ).fetch();
}

const getRecommendations = async ({count, method, currentUser}) => {
  console.log(`Getting ${count} recommendations with method ${method}`);
  // Cases here should match recommendationAlgorithms in RecommendationsAlgorithmPicker.jsx
  switch(method) {
    case "top": {
      return await topUnreadPosts({count, currentUser});
    }
    case "sampleScore2": {
      return await sampleUnreadPosts({
        count, currentUser,
        sampleWeightFn: post => Math.pow(post.baseScore, 2)
      });
    }
    case "sampleScore3": {
      return await sampleUnreadPosts({
        count, currentUser,
        sampleWeightFn: post => Math.pow(post.baseScore, 2)
      });
    }
    case "sampleScore4": {
      return await sampleUnreadPosts({
        count, currentUser,
        sampleWeightFn: post => Math.pow(post.baseScore, 2)
      });
    }
    default: {
      throw new Error(`Unrecognized recommendation algorithm: ${method}`);
    }
  }
};

addGraphQLResolvers({
  Query: {
    async Recommendations(root, {count,method}, {currentUser}) {
      return getRecommendations({count, method, currentUser})
    }
  }
});

addGraphQLQuery("Recommendations(count: Int, method: String): [Post!]");
