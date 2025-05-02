import { registerMigration, fillDefaultValues } from './migrationUtils';
import Users from '../../server/collections/users/collection';


export default registerMigration({
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
