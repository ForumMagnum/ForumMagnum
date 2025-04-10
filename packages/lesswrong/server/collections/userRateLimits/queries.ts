import schema from "@/lib/collections/userRateLimits/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlUserRateLimitQueryTypeDefs = gql`
  type UserRateLimit {
    ${getAllGraphQLFields(schema)}
  }

  input SingleUserRateLimitInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleUserRateLimitOutput {
    result: UserRateLimit
  }

  input MultiUserRateLimitInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiUserRateLimitOutput {
    results: [UserRateLimit]
    totalCount: Int
  }

  extend type Query {
    userRateLimit(input: SingleUserRateLimitInput): SingleUserRateLimitOutput
    userRateLimits(input: MultiUserRateLimitInput): MultiUserRateLimitOutput
  }
`;

export const userRateLimitGqlQueryHandlers = getDefaultResolvers('UserRateLimits');
export const userRateLimitGqlFieldResolvers = getFieldGqlResolvers('UserRateLimits', schema);
