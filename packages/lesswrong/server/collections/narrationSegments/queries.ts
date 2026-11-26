import schema from "@/lib/collections/narrationSegments/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlNarrationSegmentQueryTypeDefs = gql`
  type NarrationSegment ${ getAllGraphQLFields(schema) }
`;

export const narrationSegmentGqlFieldResolvers = getFieldGqlResolvers('NarrationSegments', schema);
