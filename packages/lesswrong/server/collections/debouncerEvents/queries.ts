import schema from "@/lib/collections/debouncerEvents/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlDebouncerEventsQueryTypeDefs = gql`
  type DebouncerEvents {
    ${getAllGraphQLFields(schema)}
  }
`;

export const debouncerEventsGqlFieldResolvers = getFieldGqlResolvers('DebouncerEvents', schema);
