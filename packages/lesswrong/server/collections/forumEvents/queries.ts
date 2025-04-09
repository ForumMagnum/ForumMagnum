import schema from "@/lib/collections/forumEvents/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlForumEventQueryTypeDefs = gql`
  type ForumEvent ${
    getAllGraphQLFields(schema)
  }

  input SingleForumEventInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleForumEventOutput {
    result: ForumEvent
  }

  input MultiForumEventInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiForumEventOutput {
    results: [ForumEvent]
    totalCount: Int
  }

  extend type Query {
    forumEvent(input: SingleForumEventInput): SingleForumEventOutput
    forumEvents(input: MultiForumEventInput): MultiForumEventOutput
  }
`;

export const forumEventGqlQueryHandlers = getDefaultResolvers('ForumEvents');
export const forumEventGqlFieldResolvers = getFieldGqlResolvers('ForumEvents', schema);
