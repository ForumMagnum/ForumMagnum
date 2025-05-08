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
  
  input SpotlightViewInput {
    documentIds: String
    spotlightIds: String
   }
  
  input SpotlightSelector @oneOf {
    default: SpotlightViewInput
    mostRecentlyPromotedSpotlights: SpotlightViewInput
    spotlightsPage: SpotlightViewInput
    spotlightsPageDraft: SpotlightViewInput
    spotlightsByDocumentIds: SpotlightViewInput
    spotlightsById: SpotlightViewInput
  }
  
  input MultiSpotlightInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
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
