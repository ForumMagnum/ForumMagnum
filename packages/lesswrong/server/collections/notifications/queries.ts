import schema from "@/lib/collections/notifications/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlNotificationQueryTypeDefs = gql`
  type Notification ${
    getAllGraphQLFields(schema)
  }

  input SingleNotificationInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleNotificationOutput {
    result: Notification
  }

  input MultiNotificationInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiNotificationOutput {
    results: [Notification]
    totalCount: Int
  }

  extend type Query {
    notification(input: SingleNotificationInput): SingleNotificationOutput
    notifications(input: MultiNotificationInput): MultiNotificationOutput
  }
`;

export const notificationGqlQueryHandlers = getDefaultResolvers('Notifications');
export const notificationGqlFieldResolvers = getFieldGqlResolvers('Notifications', schema);
