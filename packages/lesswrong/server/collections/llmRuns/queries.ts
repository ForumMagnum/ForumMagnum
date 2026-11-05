import schema from "@/lib/collections/llmRuns/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { LlmRunsViews } from "@/lib/collections/llmRuns/views";

export const graphqlLlmRunQueryTypeDefs = gql`
  type LlmRun ${ getAllGraphQLFields(schema) }

  type SingleLlmRunOutput {
    result: LlmRun
  }

  input LlmRunSelector {
    default: EmptyViewInput
  }

  type MultiLlmRunOutput {
    results: [LlmRun!]!
    totalCount: Int
  }

  extend type Query {
    llmRun(
      selector: SelectorInput
    ): SingleLlmRunOutput
    llmRuns(
      selector: LlmRunSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiLlmRunOutput
  }
`;

export const llmRunGqlQueryHandlers = getDefaultResolvers('LlmRuns', LlmRunsViews);
export const llmRunGqlFieldResolvers = getFieldGqlResolvers('LlmRuns', schema);
