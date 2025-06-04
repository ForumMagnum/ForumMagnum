import schema from "@/lib/collections/conversations/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ConversationsViews } from "@/lib/collections/conversations/views";

export const graphqlConversationQueryTypeDefs = gql`
  type Conversation ${ getAllGraphQLFields(schema) }
  
  input SingleConversationInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleConversationOutput {
    result: Conversation
  }
  
  input ConversationsModeratorConversationsInput {
    showArchive: Boolean
    userId: String
  }
  
  input ConversationsUserConversationsInput {
    showArchive: Boolean
    userId: String
  }
  
  input ConversationsUserConversationsAllInput {
    showArchive: Boolean
    userId: String
  }
  
  input ConversationsUserGroupUntitledConversationsInput {
    moderator: String
    participantIds: String
    userId: String
  }
  
  input ConversationSelector {
    default: EmptyViewInput
    moderatorConversations: ConversationsModeratorConversationsInput
    userConversations: ConversationsUserConversationsInput
    userConversationsAll: ConversationsUserConversationsAllInput
    userGroupUntitledConversations: ConversationsUserGroupUntitledConversationsInput
  }
  
  input MultiConversationInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiConversationOutput {
    results: [Conversation!]!
    totalCount: Int
  }
  
  extend type Query {
    conversation(
      input: SingleConversationInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleConversationOutput
    conversations(
      input: MultiConversationInput @deprecated(reason: "Use the selector field instead"),
      selector: ConversationSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiConversationOutput
  }
`;
export const conversationGqlQueryHandlers = getDefaultResolvers('Conversations', ConversationsViews);
export const conversationGqlFieldResolvers = getFieldGqlResolvers('Conversations', schema);
