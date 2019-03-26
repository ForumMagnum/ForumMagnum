import { addGraphQLResolvers, addGraphQLQuery } from 'meteor/vulcan:core';
import { Posts } from './collections/posts';
import Users from 'meteor/vulcan:users';

const getRecommendations = async ({currentUser}) => {
  let allPosts = await Posts.find({}, {limit:5}).fetch();
  return allPosts;
};

addGraphQLResolvers({
  Query: {
    async Recommendations(root, {count}, {currentUser}) {
      return getRecommendations({currentUser})
    }
  }
});

addGraphQLQuery("Recommendations: [Post!]");
