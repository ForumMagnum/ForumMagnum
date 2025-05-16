import schema from "@/lib/collections/spotlights/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { SpotlightsViews } from "@/lib/collections/spotlights/views";

export const graphqlSpotlightQueryTypeDefs = gql`
  type Spotlight ${ getAllGraphQLFields(schema) }
  
  input SingleSpotlightInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleSpotlightOutput {
    result: Spotlight
  }
  
  input SpotlightsMostRecentlyPromotedSpotlightsInput {
    limit: String
  }
  
  input SpotlightsSpotlightsPageInput {
    limit: String
  }
  
  input SpotlightsSpotlightsPageDraftInput {
    limit: String
  }
  
  input SpotlightsSpotlightsByDocumentIdsInput {
    documentIds: String
  }
  
  input SpotlightsSpotlightsByIdInput {
    spotlightIds: String
  }
  
  input SpotlightSelector {
    default: EmptyViewInput
    mostRecentlyPromotedSpotlights: SpotlightsMostRecentlyPromotedSpotlightsInput
    spotlightsPage: SpotlightsSpotlightsPageInput
    spotlightsPageDraft: SpotlightsSpotlightsPageDraftInput
    spotlightsByDocumentIds: SpotlightsSpotlightsByDocumentIdsInput
    spotlightsById: SpotlightsSpotlightsByIdInput
  }
  
  input MultiSpotlightInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiSpotlightOutput {
    results: [Spotlight]
    totalCount: Int
  }
  
  extend type Query {
    spotlight(
      input: SingleSpotlightInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleSpotlightOutput
    spotlights(
      input: MultiSpotlightInput @deprecated(reason: "Use the selector field instead"),
      selector: SpotlightSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiSpotlightOutput
  }
`;
export const spotlightGqlQueryHandlers = getDefaultResolvers('Spotlights', SpotlightsViews);
export const spotlightGqlFieldResolvers = getFieldGqlResolvers('Spotlights', schema);
