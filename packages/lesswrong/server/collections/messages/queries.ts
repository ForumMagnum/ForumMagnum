import schema from "@/lib/collections/messages/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { MessagesViews } from "@/lib/collections/messages/views";

export const graphqlMessageQueryTypeDefs = gql`
  type Message ${ getAllGraphQLFields(schema) }
  
  input SingleMessageInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleMessageOutput {
    result: Message
  }
  
  input MessageDefaultViewInput
  
  input MessagesMessagesConversationInput {
    conversationId: String
  }
  
  input MessagesConversationPreviewInput {
    conversationId: String
  }
  
  input MessageSelector  {
    default: MessageDefaultViewInput
    messagesConversation: MessagesMessagesConversationInput
    conversationPreview: MessagesConversationPreviewInput
  }
  
  input MultiMessageInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiMessageOutput {
    results: [Message]
    totalCount: Int
  }
  
  extend type Query {
    message(
      input: SingleMessageInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleMessageOutput
    messages(
      input: MultiMessageInput @deprecated(reason: "Use the selector field instead"),
      selector: MessageSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiMessageOutput
  }
`;
export const messageGqlQueryHandlers = getDefaultResolvers('Messages', MessagesViews);
export const messageGqlFieldResolvers = getFieldGqlResolvers('Messages', schema);
