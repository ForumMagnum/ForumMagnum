import schema from "@/lib/collections/emailTokens/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlEmailTokensQueryTypeDefs = gql`
  type EmailTokens {
    ${getAllGraphQLFields(schema)}
  }
`;

export const emailTokensGqlFieldResolvers = getFieldGqlResolvers('EmailTokens', schema);
