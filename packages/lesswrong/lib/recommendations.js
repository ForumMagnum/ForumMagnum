import { addGraphQLResolvers, addGraphQLQuery } from 'meteor/vulcan:core';
import { Posts } from './collections/posts';
import Users from 'meteor/vulcan:users';

const getRecommendations = async ({currentUser}) => {
  console.log("Got request for recommendations");
  let allPosts = await Posts.find().fetch();
  return allPosts;
};

addGraphQLResolvers({
  Query: {
    async Recommendations(root, {count}, {currentUser}) {
      return getRecommendations({currentUser})
    }
  }
});
//addGraphQLQuery("Recommendations: MultiPostOutput");
addGraphQLQuery("Recommendations: [Post!]");
