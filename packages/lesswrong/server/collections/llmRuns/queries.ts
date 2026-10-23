import schema from "@/lib/collections/llmRuns/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { LlmRunsViews } from "@/lib/collections/llmRuns/views";

export const graphqlLlmRunQueryTypeDefs = gql`
  type LlmRun ${ getAllGraphQLFields(schema) }

  input SingleLlmRunInput {
    selector: SelectorInput
    resolverArgs: JSON
  }

  type SingleLlmRunOutput {
    result: LlmRun
  }

  input LlmRunSelector {
    default: EmptyViewInput
  }

  input MultiLlmRunInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }

  type MultiLlmRunOutput {
    results: [LlmRun!]!
    totalCount: Int
  }

  extend type Query {
    llmRun(
      input: SingleLlmRunInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleLlmRunOutput
    llmRuns(
      input: MultiLlmRunInput @deprecated(reason: "Use the selector field instead"),
      selector: LlmRunSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiLlmRunOutput
  }
`;

export const llmRunGqlQueryHandlers = getDefaultResolvers('LlmRuns', LlmRunsViews);
export const llmRunGqlFieldResolvers = getFieldGqlResolvers('LlmRuns', schema);
