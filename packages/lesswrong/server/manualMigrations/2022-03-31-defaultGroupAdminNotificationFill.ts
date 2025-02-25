import { registerMigration, fillDefaultValues } from './migrationUtils';
import Users from '../../lib/collections/users/collection';


export default registerMigration({
  name: "defaultGroupAdminNotificationFill",
  dateWritten: "2022-03-31",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Users,
      fieldName: "notificationGroupAdministration",
    });
  },
});
