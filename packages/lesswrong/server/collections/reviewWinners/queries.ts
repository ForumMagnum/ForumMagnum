import schema from "@/lib/collections/reviewWinners/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlReviewWinnerQueryTypeDefs = gql`
  type ReviewWinner {
    ${getAllGraphQLFields(schema)}
  }

  input SingleReviewWinnerInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleReviewWinnerOutput {
    result: ReviewWinner
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
    reviewWinner(input: SingleReviewWinnerInput): SingleReviewWinnerOutput
    reviewWinners(input: MultiReviewWinnerInput): MultiReviewWinnerOutput
  }
`;

export const reviewWinnerGqlQueryHandlers = getDefaultResolvers('ReviewWinners');
export const reviewWinnerGqlFieldResolvers = getFieldGqlResolvers('ReviewWinners', schema);
