import schema from "@/lib/collections/pingbacks/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { PingbacksViews } from "@/lib/collections/pingbacks/views";

export const graphqlPingbackQueryTypeDefs = gql`
  type Pingback ${ getAllGraphQLFields(schema) }

  input SinglePingbackInput {
    selector: SelectorInput
    resolverArgs: JSON
  }

  type SinglePingbackOutput {
    result: Pingback
  }

  input PingbacksPingbacksToPostInput {
    postId: String
  }

  input PingbackSelector {
    default: EmptyViewInput
    pingbacksToPost: PingbacksPingbacksToPostInput
  }

  input MultiPingbackInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }

  type MultiPingbackOutput {
    results: [Pingback!]!
    totalCount: Int
  }

  extend type Query {
    pingback(
      input: SinglePingbackInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SinglePingbackOutput
    pingbacks(
      input: MultiPingbackInput @deprecated(reason: "Use the selector field instead"),
      selector: PingbackSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiPingbackOutput
  }
`;
export const pingbackGqlQueryHandlers = getDefaultResolvers('Pingbacks', PingbacksViews);
export const pingbackGqlFieldResolvers = getFieldGqlResolvers('Pingbacks', schema);
