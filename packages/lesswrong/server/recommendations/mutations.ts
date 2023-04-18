import { addGraphQLMutation, addGraphQLResolvers } from "../vulcan-lib";
import RecommendationService from "./RecommendationService";

addGraphQLMutation("clickRecommendation(postId: String!): Boolean");
addGraphQLResolvers({
  Mutation: {
    async clickRecommendation(
      _: void,
      {postId}: {postId: string},
      {currentUser}: ResolverContext,
    ): Promise<boolean> {
      if (!currentUser) {
        throw new Error("User is not logged in");
      }
      const service = new RecommendationService();
      await service.markRecommendationAsClicked(currentUser, postId);
      return true;
    }
  }
});
