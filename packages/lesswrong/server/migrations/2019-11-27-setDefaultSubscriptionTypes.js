import { registerMigration, fillDefaultValues } from './migrationUtils';
import Users from '../../lib/collections/users/collection';


registerMigration({
  name: "setDefaultSubscriptionTypes",
  dateWritten: "2019-11-27",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Users,
      fieldName: "auto_subscribe_to_my_posts",
    });
    await fillDefaultValues({
      collection: Users,
      fieldName: "auto_subscribe_to_my_comments",
    });
    await fillDefaultValues({
      collection: Users,
      fieldName: "autoSubscribeAsOrganizer",
    });
    await fillDefaultValues({
      collection: Users,
      fieldName: "notificationCommentsOnSubscribedPost",
    });
    await fillDefaultValues({
      collection: Users,
      fieldName: "notificationRepliesToMyComments",
    });
    await fillDefaultValues({
      collection: Users,
      fieldName: "notificationRepliesToSubscribedComments",
    });
    await fillDefaultValues({
      collection: Users,
      fieldName: "notificationSubscribedUserPost",
    });
    await fillDefaultValues({
      collection: Users,
      fieldName: "notificationPostsInGroups",
    });
    await fillDefaultValues({
      collection: Users,
      fieldName: "notificationPrivateMessage",
    });
    await fillDefaultValues({
      collection: Users,
      fieldName: "notificationSharedWithMe",
    });
  },
});
