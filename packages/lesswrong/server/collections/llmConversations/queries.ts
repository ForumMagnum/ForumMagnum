import schema from "@/lib/collections/llmConversations/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { LlmConversationsViews } from "@/lib/collections/llmConversations/views";

export const graphqlLlmConversationQueryTypeDefs = gql`
  type LlmConversation ${ getAllGraphQLFields(schema) }
  
  input SingleLlmConversationInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleLlmConversationOutput {
    result: LlmConversation
  }
  
  input LlmConversationsLlmConversationsWithUserInput {
    userId: String
  }
  
  input LlmConversationsLlmConversationsAllInput {
    showDeleted: Boolean
  }
  
  input LlmConversationSelector {
    default: EmptyViewInput
    llmConversationsWithUser: LlmConversationsLlmConversationsWithUserInput
    llmConversationsAll: LlmConversationsLlmConversationsAllInput
  }
  
  input MultiLlmConversationInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiLlmConversationOutput {
    results: [LlmConversation!]!
    totalCount: Int
  }
  
  extend type Query {
    llmConversation(
      input: SingleLlmConversationInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleLlmConversationOutput
    llmConversations(
      input: MultiLlmConversationInput @deprecated(reason: "Use the selector field instead"),
      selector: LlmConversationSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiLlmConversationOutput
  }
`;
export const llmConversationGqlQueryHandlers = getDefaultResolvers('LlmConversations', LlmConversationsViews);
export const llmConversationGqlFieldResolvers = getFieldGqlResolvers('LlmConversations', schema);
