import schema from "@/lib/collections/reviewWinnerArts/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlReviewWinnerArtQueryTypeDefs = gql`
  type ReviewWinnerArt ${
    getAllGraphQLFields(schema)
  }

  input SingleReviewWinnerArtInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleReviewWinnerArtOutput {
    result: ReviewWinnerArt
  }

  input MultiReviewWinnerArtInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiReviewWinnerArtOutput {
    results: [ReviewWinnerArt]
    totalCount: Int
  }

  extend type Query {
    reviewWinnerArt(input: SingleReviewWinnerArtInput): SingleReviewWinnerArtOutput
    reviewWinnerArts(input: MultiReviewWinnerArtInput): MultiReviewWinnerArtOutput
  }
`;

export const reviewWinnerArtGqlQueryHandlers = getDefaultResolvers('ReviewWinnerArts');
export const reviewWinnerArtGqlFieldResolvers = getFieldGqlResolvers('ReviewWinnerArts', schema);
