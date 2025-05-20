import schema from "@/lib/collections/forumEvents/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ForumEventsViews } from "@/lib/collections/forumEvents/views";

export const graphqlForumEventQueryTypeDefs = gql`
  type ForumEvent ${ getAllGraphQLFields(schema) }

  enum ForumEventCustomComponent {
    GivingSeason2024Banner
  }
  
  enum ForumEventFormat {
    BASIC
    POLL
    STICKERS
  }
  
  input SingleForumEventInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleForumEventOutput {
    result: ForumEvent
  }
  
  input ForumEventsUpcomingForumEventsInput {
    limit: String
  }
  
  input ForumEventsPastForumEventsInput {
    limit: String
  }
  
  input ForumEventsCurrentAndRecentForumEventsInput {
    limit: String
  }
  
  input ForumEventSelector {
    default: EmptyViewInput
    upcomingForumEvents: ForumEventsUpcomingForumEventsInput
    pastForumEvents: ForumEventsPastForumEventsInput
    currentForumEvent: EmptyViewInput
    currentAndRecentForumEvents: ForumEventsCurrentAndRecentForumEventsInput
  }
  
  input MultiForumEventInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiForumEventOutput {
    results: [ForumEvent]
    totalCount: Int
  }
  
  extend type Query {
    forumEvent(
      input: SingleForumEventInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleForumEventOutput
    forumEvents(
      input: MultiForumEventInput @deprecated(reason: "Use the selector field instead"),
      selector: ForumEventSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiForumEventOutput
  }
`;
export const forumEventGqlQueryHandlers = getDefaultResolvers('ForumEvents', ForumEventsViews);
export const forumEventGqlFieldResolvers = getFieldGqlResolvers('ForumEvents', schema);
