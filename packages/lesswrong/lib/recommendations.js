import { addGraphQLResolvers, addGraphQLQuery } from 'meteor/vulcan:core';
import { Posts } from './collections/posts';

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

const getRecommendations = async ({count, currentUser}) => {
  if (!currentUser) {
    return await getLoggedOutRecommendations({count});
  }
  
  const unreadTopPostsMeta = await Posts.aggregate([
    { $match: {
      status: Posts.config.STATUS_APPROVED,
      isFuture: false,
      baseScore: {$gt: 30},
      draft: false,
      unlisted: false,
      authorIsUnreviewed: false,
      groupId: {$exists: false},
    } },
    { $project: {_id:1, baseScore:1} },
    { $sort: {baseScore:-1} },
    
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
    
    { $project: {_id:1} },
    { $limit: count }
  ]).toArray();
  
  const unreadTopPostIds = _.map(unreadTopPostsMeta, p=>p._id);
  const unreadTopPosts = await Posts.find(
    { _id: {$in: unreadTopPostIds} },
    { sort: {baseScore: -1} }
  ).fetch();
  
  return unreadTopPosts;
};

addGraphQLResolvers({
  Query: {
    async Recommendations(root, {count}, {currentUser}) {
      return getRecommendations({count, currentUser})
    }
  }
});

addGraphQLQuery("Recommendations(count: Int): [Post!]");
