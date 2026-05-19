import schema from "@/lib/collections/researchConversations/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ResearchConversationsViews } from "@/lib/collections/researchConversations/views";

export const graphqlResearchConversationQueryTypeDefs = gql`
  type ResearchConversation ${ getAllGraphQLFields(schema) }

  input SingleResearchConversationInput {
    selector: SelectorInput
    resolverArgs: JSON
  }

  type SingleResearchConversationOutput {
    result: ResearchConversation
  }

  input ResearchConversationsByProjectInput {
    projectId: String
  }

  input ResearchConversationSelector {
    default: EmptyViewInput
    byProject: ResearchConversationsByProjectInput
  }

  input MultiResearchConversationInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }

  type MultiResearchConversationOutput {
    results: [ResearchConversation!]!
    totalCount: Int
  }

  extend type Query {
    researchConversation(
      input: SingleResearchConversationInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleResearchConversationOutput
    researchConversations(
      input: MultiResearchConversationInput @deprecated(reason: "Use the selector field instead"),
      selector: ResearchConversationSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiResearchConversationOutput
  }
`;
export const researchConversationGqlQueryHandlers = getDefaultResolvers('ResearchConversations', ResearchConversationsViews);
export const researchConversationGqlFieldResolvers = getFieldGqlResolvers('ResearchConversations', schema);
