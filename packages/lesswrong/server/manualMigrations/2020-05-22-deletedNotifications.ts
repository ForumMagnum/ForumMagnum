import { registerMigration, fillDefaultValues } from './migrationUtils';
import { Notifications } from '../../server/collections/notifications/collection';

export default registerMigration({
  name: "deletedNotifications",
  dateWritten: "2020-05-22",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Notifications,
      fieldName: "deleted"
    });
  }
})
