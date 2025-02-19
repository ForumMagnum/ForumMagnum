import { registerMigration, fillDefaultValues } from './migrationUtils';
import Users from '../../lib/collections/users/collection';


registerMigration({
  name: "defaultRSVPNotificationFill",
  dateWritten: "2021-08-23",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Users,
      fieldName: "notificationRSVPs",
    });
  },
});
