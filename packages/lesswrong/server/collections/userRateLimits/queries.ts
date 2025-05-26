import schema from "@/lib/collections/userRateLimits/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { UserRateLimitsViews } from "@/lib/collections/userRateLimits/views";

export const graphqlUserRateLimitQueryTypeDefs = gql`
  type UserRateLimit ${ getAllGraphQLFields(schema) }

  enum UserRateLimitType {
    allComments
    allPosts
  }
  
  enum UserRateLimitIntervalUnit {
    minutes
    hours
    days
    weeks
  }
  
  input SingleUserRateLimitInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleUserRateLimitOutput {
    result: UserRateLimit
  }
  
  input UserRateLimitsUserRateLimitsInput {
    active: Boolean
    userIds: [String!]
  }
  
  input UserRateLimitSelector {
    default: EmptyViewInput
    userRateLimits: UserRateLimitsUserRateLimitsInput
    activeUserRateLimits: EmptyViewInput
  }
  
  input MultiUserRateLimitInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiUserRateLimitOutput {
    results: [UserRateLimit!]!
    totalCount: Int
  }
  
  extend type Query {
    userRateLimit(
      input: SingleUserRateLimitInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleUserRateLimitOutput
    userRateLimits(
      input: MultiUserRateLimitInput @deprecated(reason: "Use the selector field instead"),
      selector: UserRateLimitSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiUserRateLimitOutput
  }
`;
export const userRateLimitGqlQueryHandlers = getDefaultResolvers('UserRateLimits', UserRateLimitsViews);
export const userRateLimitGqlFieldResolvers = getFieldGqlResolvers('UserRateLimits', schema);
