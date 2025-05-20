import schema from "@/lib/collections/lwevents/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { LWEventsViews } from "@/lib/collections/lwevents/views";

export const graphqlLweventQueryTypeDefs = gql`
  type LWEvent ${ getAllGraphQLFields(schema) }
  
  input SingleLWEventInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleLWEventOutput {
    result: LWEvent
  }
  
  input LWEventsAdminViewInput {
    name: String
  }
  
  input LWEventsPostVisitsInput {
    postId: String
    userId: String
    limit: String
  }
  
  input LWEventsEmailHistoryInput {
    userId: String
  }
  
  input LWEventSelector {
    default: EmptyViewInput
    adminView: LWEventsAdminViewInput
    postVisits: LWEventsPostVisitsInput
    emailHistory: LWEventsEmailHistoryInput
    gatherTownUsers: EmptyViewInput
  }
  
  input MultiLWEventInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiLWEventOutput {
    results: [LWEvent]
    totalCount: Int
  }
  
  extend type Query {
    lWEvent(
      input: SingleLWEventInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleLWEventOutput
    lWEvents(
      input: MultiLWEventInput @deprecated(reason: "Use the selector field instead"),
      selector: LWEventSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiLWEventOutput
  }
`;
export const lweventGqlQueryHandlers = getDefaultResolvers('LWEvents', LWEventsViews);
export const lweventGqlFieldResolvers = getFieldGqlResolvers('LWEvents', schema);
