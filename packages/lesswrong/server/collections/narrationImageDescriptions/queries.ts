import schema from "@/lib/collections/narrationImageDescriptions/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlNarrationImageDescriptionQueryTypeDefs = gql`
  type NarrationImageDescription ${ getAllGraphQLFields(schema) }
`;

export const narrationImageDescriptionGqlFieldResolvers = getFieldGqlResolvers('NarrationImageDescriptions', schema);
