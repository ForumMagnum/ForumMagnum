import schema from "@/lib/collections/ultraFeedEvents/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { UltraFeedEventsViews } from "@/lib/collections/ultraFeedEvents/views";

export const graphqlUltraFeedEventQueryTypeDefs = gql`
  type UltraFeedEvent ${ getAllGraphQLFields(schema) }
  
  input SingleUltraFeedEventInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleUltraFeedEventOutput {
    result: UltraFeedEvent
  }
  
  
  
  input UltraFeedEventSelector {
    default: EmptyViewInput
  }
  
  input MultiUltraFeedEventInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiUltraFeedEventOutput {
    results: [UltraFeedEvent]
    totalCount: Int
  }
  
  extend type Query {
    ultraFeedEvent(
      input: SingleUltraFeedEventInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleUltraFeedEventOutput
    ultraFeedEvents(
      input: MultiUltraFeedEventInput @deprecated(reason: "Use the selector field instead"),
      selector: UltraFeedEventSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiUltraFeedEventOutput
  }
`;
export const ultraFeedEventGqlQueryHandlers = getDefaultResolvers('UltraFeedEvents', UltraFeedEventsViews);
export const ultraFeedEventGqlFieldResolvers = getFieldGqlResolvers('UltraFeedEvents', schema);
