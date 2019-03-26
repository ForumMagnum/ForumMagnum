import { addGraphQLResolvers, addGraphQLQuery } from 'meteor/vulcan:core';
import { Posts } from './collections/posts';
import Users from 'meteor/vulcan:users';

const getRecommendations = async ({count, currentUser}) => {
  let allPosts = await Posts.find({}, {limit:count}).fetch();
  return allPosts;
};

addGraphQLResolvers({
  Query: {
    async Recommendations(root, {count}, {currentUser}) {
      return getRecommendations({count, currentUser})
    }
  }
});

addGraphQLQuery("Recommendations(count: Int): [Post!]");
