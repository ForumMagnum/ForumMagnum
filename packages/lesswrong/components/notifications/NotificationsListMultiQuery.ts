import { gql } from '@/lib/generated/gql-codegen';

// Shared with useUnreadNotifications, which enables triggering refetches of
// this query via a context provider
export const NotificationsListMultiQuery = gql(`
  query multiNotificationNotificationsListQuery($selector: NotificationSelector, $limit: Int, $enableTotal: Boolean) {
    notifications(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...NotificationsList
      }
      totalCount
    }
  }
`);
