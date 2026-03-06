import schema from "@/lib/collections/oAuthAuthorizationCodes/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlOAuthAuthorizationCodeQueryTypeDefs = gql`
  type OAuthAuthorizationCode ${ getAllGraphQLFields(schema) }
`;

export const oAuthAuthorizationCodeGqlFieldResolvers = getFieldGqlResolvers('OAuthAuthorizationCodes', schema);
