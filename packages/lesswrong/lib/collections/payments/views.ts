import { ensureIndex } from '../../collectionUtils';
import Payments from './collection';

declare global {
  interface PaymentsViewTerms extends ViewTermsBase {
    view?: PaymentsViewName
  }
}

// will be common to all other view unless specific properties are overwritten
Payments.addDefaultView(function (terms: PaymentsViewTerms) {
  return {
    selector: {
    },
    options: {limit: 10},
  };
});

// // notifications for a specific user (what you see in the notifications menu)
// Notifications.addView("userNotifications", (terms: NotificationsViewTerms) => {
//   return {
//     selector: {
//       userId: terms.userId,
//       type: terms.type || null,
//       viewed: terms.viewed == null ? null : (terms.viewed || false)
//     }, //Ugly construction to deal with falsy viewed values and null != false in Mongo
//     options: {sort: {createdAt: -1}}
//   }
// });
// ensureIndex(Notifications, {userId:1, emailed:1, waitingForBatch:1, createdAt:-1, type:1});