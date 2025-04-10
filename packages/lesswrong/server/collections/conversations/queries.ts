import schema from "@/lib/collections/conversations/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlConversationQueryTypeDefs = gql`
  type Conversation {
    ${getAllGraphQLFields(schema)}
  }

  input SingleConversationInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleConversationOutput {
    result: Conversation
  }

  input MultiConversationInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiConversationOutput {
    results: [Conversation]
    totalCount: Int
  }

  extend type Query {
    conversation(input: SingleConversationInput): SingleConversationOutput
    conversations(input: MultiConversationInput): MultiConversationOutput
  }
`;

export const conversationGqlQueryHandlers = getDefaultResolvers('Conversations');
export const conversationGqlFieldResolvers = getFieldGqlResolvers('Conversations', schema);
