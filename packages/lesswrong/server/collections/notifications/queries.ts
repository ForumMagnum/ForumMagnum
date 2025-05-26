import schema from "@/lib/collections/notifications/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { NotificationsViews } from "@/lib/collections/notifications/views";

export const graphqlNotificationQueryTypeDefs = gql`
  type Notification ${ getAllGraphQLFields(schema) }
  
  input SingleNotificationInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleNotificationOutput {
    result: Notification
  }
  
  input NotificationsUserNotificationsInput {
    userId: String
    type: String
    viewed: String
  }
  
  input NotificationsUnreadUserNotificationsInput {
    userId: String
    type: String
    lastViewedDate: String
  }
  
  input NotificationsAdminAlertNotificationsInput {
    type: String
  }
  
  input NotificationSelector {
    default: EmptyViewInput
    userNotifications: NotificationsUserNotificationsInput
    unreadUserNotifications: NotificationsUnreadUserNotificationsInput
    adminAlertNotifications: NotificationsAdminAlertNotificationsInput
  }
  
  input MultiNotificationInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiNotificationOutput {
    results: [Notification!]!
    totalCount: Int
  }
  
  extend type Query {
    notification(
      input: SingleNotificationInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleNotificationOutput
    notifications(
      input: MultiNotificationInput @deprecated(reason: "Use the selector field instead"),
      selector: NotificationSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiNotificationOutput
  }
`;
export const notificationGqlQueryHandlers = getDefaultResolvers('Notifications', NotificationsViews);
export const notificationGqlFieldResolvers = getFieldGqlResolvers('Notifications', schema);
