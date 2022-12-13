import { registerMigration, fillDefaultValues } from './migrationUtils';
import Users from '../../lib/collections/users/collection';


registerMigration({
  name: "defaultSessionReplay",
  dateWritten: "2022-12-13",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Users,
      fieldName: "allowDatadogSessionReplay",
    });
  },
});
