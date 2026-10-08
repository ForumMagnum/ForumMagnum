import schema from "@/lib/collections/researchConversationEvents/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ResearchConversationEventsViews } from "@/lib/collections/researchConversationEvents/views";

export const graphqlResearchConversationEventQueryTypeDefs = gql`
  type ResearchConversationEvent ${ getAllGraphQLFields(schema) }

  input SingleResearchConversationEventInput {
    selector: SelectorInput
    resolverArgs: JSON
  }

  type SingleResearchConversationEventOutput {
    result: ResearchConversationEvent
  }

  input ResearchConversationEventSelector {
    default: EmptyViewInput
  }

  input MultiResearchConversationEventInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }

  type MultiResearchConversationEventOutput {
    results: [ResearchConversationEvent!]!
    totalCount: Int
  }

  extend type Query {
    researchConversationEvent(
      selector: SelectorInput
    ): SingleResearchConversationEventOutput
    researchConversationEvents(
      selector: ResearchConversationEventSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiResearchConversationEventOutput
  }
`;
export const researchConversationEventGqlQueryHandlers = getDefaultResolvers('ResearchConversationEvents', ResearchConversationEventsViews);
export const researchConversationEventGqlFieldResolvers = getFieldGqlResolvers('ResearchConversationEvents', schema);
