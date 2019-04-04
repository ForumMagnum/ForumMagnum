import { addGraphQLResolvers, addGraphQLQuery } from 'meteor/vulcan:core';
import { Posts } from '../lib/collections/posts';
import { WeightedList } from './weightedList.js';

const getLoggedOutRecommendations = async ({count}) => {
  let topPosts = await Posts.find(
    {},
    {
      limit:count,
      sort: {baseScore: -1}
    }
  ).fetch();
  return topPosts;
}

const pipelineFilterUnread = ({currentUser}) => {
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

const sampleUnreadPosts = async ({count, currentUser}) => {
  const unreadPostsMetadata = await Posts.aggregate([
    { $match: {
      ...recommendablePostFilter,
    } },
    
    ...pipelineFilterUnread({currentUser}),
    
    { $project: {_id:1, baseScore:1} },
  ]).toArray();
  
  console.log(`Sampling ${count} posts from ${unreadPostsMetadata.length} posts`);
  
  const sampledPosts = new WeightedList(
    _.map(unreadPostsMetadata, post => [post._id, Math.pow(post.baseScore, 2)])
  ).pop(count);
  console.log(`Got ${sampledPosts.length} posts`);
  console.log(sampledPosts);
  
  return await Posts.find(
    { _id: {$in: sampledPosts} },
  ).fetch();
}

const getRecommendations = async ({count, currentUser}) => {
  if (!currentUser) {
    return await getLoggedOutRecommendations({count});
  }
  
  //return await topUnreadPosts({count, currentUser});
  return await sampleUnreadPosts({count, currentUser});
};

addGraphQLResolvers({
  Query: {
    async Recommendations(root, {count}, {currentUser}) {
      return getRecommendations({count, currentUser})
    }
  }
});

addGraphQLQuery("Recommendations(count: Int): [Post!]");
