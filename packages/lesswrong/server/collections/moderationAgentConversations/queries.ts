import schema from "@/lib/collections/moderationAgentConversations/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ModerationAgentConversationsViews } from "@/lib/collections/moderationAgentConversations/views";

export const graphqlModerationAgentConversationQueryTypeDefs = gql`
  type ModerationAgentConversation ${ getAllGraphQLFields(schema) }

  input SingleModerationAgentConversationInput {
    selector: SelectorInput
    resolverArgs: JSON
  }

  type SingleModerationAgentConversationOutput {
    result: ModerationAgentConversation
  }

  input ModerationAgentConversationsConversationsForTargetInput {
    targetUserId: String
  }

  input ModerationAgentConversationSelector {
    default: EmptyViewInput
    conversationsForTarget: ModerationAgentConversationsConversationsForTargetInput
  }

  input MultiModerationAgentConversationInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }

  type MultiModerationAgentConversationOutput {
    results: [ModerationAgentConversation!]!
    totalCount: Int
  }

  extend type Query {
    moderationAgentConversation(
      input: SingleModerationAgentConversationInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleModerationAgentConversationOutput
    moderationAgentConversations(
      input: MultiModerationAgentConversationInput @deprecated(reason: "Use the selector field instead"),
      selector: ModerationAgentConversationSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiModerationAgentConversationOutput
  }
`;
export const moderationAgentConversationGqlQueryHandlers = getDefaultResolvers('ModerationAgentConversations', ModerationAgentConversationsViews);
export const moderationAgentConversationGqlFieldResolvers = getFieldGqlResolvers('ModerationAgentConversations', schema);
