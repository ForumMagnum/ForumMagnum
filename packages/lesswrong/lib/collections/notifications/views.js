import Notifications from './collection.js';

// will be common to all other view unless specific properties are overwritten
Notifications.addDefaultView(function (terms) {
  return {
    options: {limit: 1000}
  };
});

// notifications for a specific user (what you see in the notifications menu)
Notifications.addView("userNotifications", (terms) => {
  return {
    selector: {userId: terms.userId, type: terms.type || null, viewed: terms.viewed == null ? null : (terms.viewed || {$ne: true})}, //Ugly construction to deal with falsy viewed values and null != false in Mongo
    options: {sort: {createdAt: -1}}
  }
});

Notifications.addView("unreadUserNotifications", (terms) => {
  return {
    selector: {userId: terms.userId, type: terms.type || null, createdAt: {$gte: terms.lastViewedDate}},
    options: {sort: {createdAt: -1}}
  }
})
