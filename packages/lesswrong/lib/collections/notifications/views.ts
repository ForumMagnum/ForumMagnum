import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface NotificationsViewTerms extends ViewTermsBase {
    view: NotificationsViewName | 'default' | undefined
    type?: string
    userId?: string
    viewed?: boolean
    lastViewedDate?: Date
  }
}

function defaultView(terms: NotificationsViewTerms) {
  // const alignmentForum = forumTypeSetting.get() === 'AlignmentForum' ? {af: true} : {}
  return {
    selector: {
      // ...alignmentForum, TODO: develop better notification system for AlignmentForum that properly filters 
      emailed: false,
      waitingForBatch: false,
      deleted: false
    },
    options: {limit: 1000},
  };
}

// notifications for a specific user (what you see in the notifications menu)
function userNotifications(terms: NotificationsViewTerms) {
  if (!terms.userId) {
    throw new Error("userNotifications view called without a userId");
  }
  return {
    selector: {
      userId: terms.userId,
      type: terms.type || null,
      viewed: terms.viewed == null ? null : (terms.viewed || false)
    }, //Ugly construction to deal with falsy viewed values and null != false in Mongo
    options: {sort: {createdAt: -1}}
  };
}

function unreadUserNotifications(terms: NotificationsViewTerms) {
  return {
    selector: {
      userId: terms.userId,
      type: terms.type || null,
      createdAt: {$gte: terms.lastViewedDate}
    },
    options: {sort: {createdAt: -1}}
  };
}

function adminAlertNotifications(terms: NotificationsViewTerms) {
  return {
    selector: {
      type: terms.type || null,
    }, //Ugly construction to deal with falsy viewed values and null != false in Mongo
    options: {sort: {createdAt: -1}}
  };
}

export const NotificationsViews = new CollectionViewSet('Notifications', {
  userNotifications,
  unreadUserNotifications,
  adminAlertNotifications
}, defaultView);
