import schema from "@/lib/collections/splashArtCoordinates/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CollectionViewSet } from "@/lib/views/collectionViewSet";

export const graphqlSplashArtCoordinateQueryTypeDefs = gql`
  type SplashArtCoordinate ${ getAllGraphQLFields(schema) }
  
  input SingleSplashArtCoordinateInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleSplashArtCoordinateOutput {
    result: SplashArtCoordinate
  }
  
  input SplashArtCoordinateViewInput
  
  input SplashArtCoordinateSelector  {
    default: SplashArtCoordinateViewInput
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
    splashArtCoordinate(
      input: SingleSplashArtCoordinateInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleSplashArtCoordinateOutput
    splashArtCoordinates(
      input: MultiSplashArtCoordinateInput @deprecated(reason: "Use the selector field instead"),
      selector: SplashArtCoordinateSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiSplashArtCoordinateOutput
  }
`;
export const splashArtCoordinateGqlQueryHandlers = getDefaultResolvers('SplashArtCoordinates', new CollectionViewSet('SplashArtCoordinates', {}));
export const splashArtCoordinateGqlFieldResolvers = getFieldGqlResolvers('SplashArtCoordinates', schema);
