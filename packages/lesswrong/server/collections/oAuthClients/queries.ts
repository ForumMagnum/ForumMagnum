import schema from "@/lib/collections/oAuthClients/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlOAuthClientQueryTypeDefs = gql`
  type OAuthClient ${ getAllGraphQLFields(schema) }
`;

export const oAuthClientGqlFieldResolvers = getFieldGqlResolvers('OAuthClients', schema);
