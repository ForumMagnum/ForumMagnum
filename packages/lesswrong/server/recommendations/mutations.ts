import { addGraphQLMutation, addGraphQLResolvers } from "../../lib/vulcan-lib/graphql";
import RecommendationService from "./RecommendationService";

addGraphQLMutation("observeRecommendation(postId: String!): Boolean");
addGraphQLResolvers({
  Mutation: {
    async observeRecommendation(
      _: void,
      {postId}: {postId: string},
      {currentUser, clientId}: ResolverContext,
    ): Promise<boolean> {
      const service = new RecommendationService();
      await service.markRecommendationAsObserved(currentUser, clientId, postId);
      return true;
    }
  }
});

addGraphQLMutation("clickRecommendation(postId: String!): Boolean");
addGraphQLResolvers({
  Mutation: {
    async clickRecommendation(
      _: void,
      {postId}: {postId: string},
      {currentUser, clientId}: ResolverContext,
    ): Promise<boolean> {
      const service = new RecommendationService();
      await service.markRecommendationAsClicked(currentUser, clientId, postId);
      return true;
    }
  }
});
