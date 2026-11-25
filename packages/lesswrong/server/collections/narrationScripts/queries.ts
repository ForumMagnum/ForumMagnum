import schema from "@/lib/collections/narrationScripts/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlNarrationScriptQueryTypeDefs = gql`
  type NarrationScript ${ getAllGraphQLFields(schema) }
`;

export const narrationScriptGqlFieldResolvers = getFieldGqlResolvers('NarrationScripts', schema);
