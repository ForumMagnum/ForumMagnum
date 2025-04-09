import schema from "@/lib/collections/splashArtCoordinates/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlSplashArtCoordinateQueryTypeDefs = gql`
  type SplashArtCoordinate ${
    getAllGraphQLFields(schema)
  }

  input SingleSplashArtCoordinateInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleSplashArtCoordinateOutput {
    result: SplashArtCoordinate
  }

  input MultiSplashArtCoordinateInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiSplashArtCoordinateOutput {
    results: [SplashArtCoordinate]
    totalCount: Int
  }

  extend type Query {
    splashArtCoordinate(input: SingleSplashArtCoordinateInput): SingleSplashArtCoordinateOutput
    splashArtCoordinates(input: MultiSplashArtCoordinateInput): MultiSplashArtCoordinateOutput
  }
`;

export const splashArtCoordinateGqlQueryHandlers = getDefaultResolvers('SplashArtCoordinates');
export const splashArtCoordinateGqlFieldResolvers = getFieldGqlResolvers('SplashArtCoordinates', schema);
