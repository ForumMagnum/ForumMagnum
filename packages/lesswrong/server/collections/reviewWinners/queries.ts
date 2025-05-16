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
  
  input ReviewWinnerDefaultViewInput
  
  input ReviewWinnersReviewWinnerSingleInput {
    category: String
    reviewYear: String
    reviewRanking: String
  }
  
  input ReviewWinnersBestOfLessWrongAnnouncementInput
  
  input ReviewWinnerSelector  {
    default: ReviewWinnerDefaultViewInput
    reviewWinnerSingle: ReviewWinnersReviewWinnerSingleInput
    bestOfLessWrongAnnouncement: ReviewWinnersBestOfLessWrongAnnouncementInput
  }
  
  input MultiReviewWinnerInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
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
