import schema from "@/lib/collections/reviewWinners/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ReviewWinnersViews } from "@/lib/collections/reviewWinners/views";

export const graphqlReviewWinnerQueryTypeDefs = gql`
  type ReviewWinner ${ getAllGraphQLFields(schema) }
  
  input SingleReviewWinnerInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleReviewWinnerOutput {
    result: ReviewWinner
  }
  
  input ReviewWinnerViewInput {
    reviewYear: String
    reviewRanking: String
    category: String
   }
  
  input ReviewWinnerSelector @oneOf {
    default: ReviewWinnerViewInput
    reviewWinnerSingle: ReviewWinnerViewInput
    bestOfLessWrongAnnouncement: ReviewWinnerViewInput
  }
  
  input MultiReviewWinnerInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiReviewWinnerOutput {
    results: [ReviewWinner]
    totalCount: Int
  }
  
  extend type Query {
    reviewWinner(
      input: SingleReviewWinnerInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleReviewWinnerOutput
    reviewWinners(
      input: MultiReviewWinnerInput @deprecated(reason: "Use the selector field instead"),
      selector: ReviewWinnerSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiReviewWinnerOutput
  }
`;
export const reviewWinnerGqlQueryHandlers = getDefaultResolvers('ReviewWinners', ReviewWinnersViews);
export const reviewWinnerGqlFieldResolvers = getFieldGqlResolvers('ReviewWinners', schema);
