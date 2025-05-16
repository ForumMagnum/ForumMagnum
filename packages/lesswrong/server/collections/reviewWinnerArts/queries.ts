import schema from "@/lib/collections/reviewWinnerArts/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ReviewWinnerArtsViews } from "@/lib/collections/reviewWinnerArts/views";

export const graphqlReviewWinnerArtQueryTypeDefs = gql`
  type ReviewWinnerArt ${ getAllGraphQLFields(schema) }
  
  input SingleReviewWinnerArtInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleReviewWinnerArtOutput {
    result: ReviewWinnerArt
  }
  
  input ReviewWinnerArtsPostArtInput {
    postId: String
  }
  
  input ReviewWinnerArtSelector {
    default: EmptyViewInput
    postArt: ReviewWinnerArtsPostArtInput
    allForYear: EmptyViewInput
  }
  
  input MultiReviewWinnerArtInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiReviewWinnerArtOutput {
    results: [ReviewWinnerArt]
    totalCount: Int
  }
  
  extend type Query {
    reviewWinnerArt(
      input: SingleReviewWinnerArtInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleReviewWinnerArtOutput
    reviewWinnerArts(
      input: MultiReviewWinnerArtInput @deprecated(reason: "Use the selector field instead"),
      selector: ReviewWinnerArtSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiReviewWinnerArtOutput
  }
`;
export const reviewWinnerArtGqlQueryHandlers = getDefaultResolvers('ReviewWinnerArts', ReviewWinnerArtsViews);
export const reviewWinnerArtGqlFieldResolvers = getFieldGqlResolvers('ReviewWinnerArts', schema);
