import { registerMigration, fillDefaultValues } from './migrationUtils';

import { Notifications } from '../../lib/collections/notifications/collection.js';

registerMigration({
  name: "setDefaultSubscriptionTypes",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Notifications,
      fieldName: "auto_subscribe_to_my_posts",
    });
    await fillDefaultValues({
      collection: Notifications,
      fieldName: "auto_subscribe_to_my_comments",
    });
    await fillDefaultValues({
      collection: Notifications,
      fieldName: "autoSubscribeAsOrganizer",
    });
    await fillDefaultValues({
      collection: Notifications,
      fieldName: "notificationCommentsOnSubscribedPost",
    });
    await fillDefaultValues({
      collection: Notifications,
      fieldName: "notificationRepliesToMyComments",
    });
    await fillDefaultValues({
      collection: Notifications,
      fieldName: "notificationRepliesToSubscribedComments",
    });
    await fillDefaultValues({
      collection: Notifications,
      fieldName: "notificationSubscribedUserPost",
    });
    await fillDefaultValues({
      collection: Notifications,
      fieldName: "notificationPostsInGroups",
    });
    await fillDefaultValues({
      collection: Notifications,
      fieldName: "notificationPrivateMessage",
    });
    await fillDefaultValues({
      collection: Notifications,
      fieldName: "notificationSharedWithMe",
    });
  },
});
