import { ensureIndex } from '../../collectionIndexUtils';
import Notifications from './collection';

declare global {
  interface NotificationsViewTerms extends ViewTermsBase {
    view?: NotificationsViewName
    type?: string
    userId?: string
    viewed?: boolean
    lastViewedDate?: Date
  }
}

// will be common to all other view unless specific properties are overwritten
Notifications.addDefaultView(function (terms: NotificationsViewTerms) {
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
});

// notifications for a specific user (what you see in the notifications menu)
Notifications.addView("userNotifications", (terms: NotificationsViewTerms) => {
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
  }
});
ensureIndex(Notifications, {userId:1, emailed:1, waitingForBatch:1, createdAt:-1, type:1});

Notifications.addView("unreadUserNotifications", (terms: NotificationsViewTerms) => {
  return {
    selector: {
      userId: terms.userId,
      type: terms.type || null,
      createdAt: {$gte: terms.lastViewedDate}
    },
    options: {sort: {createdAt: -1}}
  }
})
ensureIndex(Notifications, {userId:1, type:1, createdAt:-1});

// Index used in callbacks for finding notifications related to a document
// that is being deleted
ensureIndex(Notifications, {documentId:1});

// Used by server-sent events
ensureIndex(Notifications, {createdAt:1});

Notifications.addView("adminAlertNotifications", (terms: NotificationsViewTerms) => {
  return {
    selector: {
      type: terms.type || null,
    }, //Ugly construction to deal with falsy viewed values and null != false in Mongo
    options: {sort: {createdAt: -1}}
  }
});
