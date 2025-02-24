import { registerMigration, fillDefaultValues } from './migrationUtils';
import { Users } from '../../lib/collections/users/collection';

export default registerMigration({
  name: "notificationSubscribedTagPost",
  dateWritten: "2020-05-22",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Users,
      fieldName: "notificationSubscribedTagPost",
    });
  }
})
