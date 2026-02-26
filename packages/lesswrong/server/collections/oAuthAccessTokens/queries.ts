import schema from "@/lib/collections/oAuthAccessTokens/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlOAuthAccessTokenQueryTypeDefs = gql`
  type OAuthAccessToken ${ getAllGraphQLFields(schema) }
`;

export const oAuthAccessTokenGqlFieldResolvers = getFieldGqlResolvers('OAuthAccessTokens', schema);
