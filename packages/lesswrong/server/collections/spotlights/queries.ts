import schema from "@/lib/collections/spotlights/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlSpotlightQueryTypeDefs = gql`
  type Spotlight ${
    getAllGraphQLFields(schema)
  }

  input SingleSpotlightInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleSpotlightOutput {
    result: Spotlight
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
    spotlight(input: SingleSpotlightInput): SingleSpotlightOutput
    spotlights(input: MultiSpotlightInput): MultiSpotlightOutput
  }
`;

export const spotlightGqlQueryHandlers = getDefaultResolvers('Spotlights');
export const spotlightGqlFieldResolvers = getFieldGqlResolvers('Spotlights', schema);
