import gql from "graphql-tag";
import RecommendationService from "./RecommendationService";

export const recommendationsGqlMutations = {
  async observeRecommendation(
    _: void,
    {postId}: {postId: string},
    {currentUser, clientId}: ResolverContext,
  ): Promise<boolean> {
    const service = new RecommendationService();
    await service.markRecommendationAsObserved(currentUser, clientId, postId);
    return true;
  },
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

export const recommendationsGqlTypeDefs = gql`
  extend type Mutation {
    observeRecommendation(postId: String!): Boolean
    clickRecommendation(postId: String!): Boolean
  }
`
