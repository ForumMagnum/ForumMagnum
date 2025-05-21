import schema from "@/lib/collections/llmConversations/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlLlmConversationQueryTypeDefs = gql`
  type LlmConversation {
    ${getAllGraphQLFields(schema)}
  }

  input SingleLlmConversationInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleLlmConversationOutput {
    result: LlmConversation
  }

  input MultiLlmConversationInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiLlmConversationOutput {
    results: [LlmConversation]
    totalCount: Int
  }

  extend type Query {
    llmConversation(input: SingleLlmConversationInput): SingleLlmConversationOutput
    llmConversations(input: MultiLlmConversationInput): MultiLlmConversationOutput
  }
`;

export const llmConversationGqlQueryHandlers = getDefaultResolvers('LlmConversations');
export const llmConversationGqlFieldResolvers = getFieldGqlResolvers('LlmConversations', schema);
