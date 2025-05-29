import schema from "@/lib/collections/sessions/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlSessionQueryTypeDefs = gql`
  type Session {
    ${getAllGraphQLFields(schema)}
  }
`;

export const sessionGqlFieldResolvers = getFieldGqlResolvers('Sessions', schema);
