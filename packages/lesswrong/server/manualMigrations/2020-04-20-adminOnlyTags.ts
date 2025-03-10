import { registerMigration, fillDefaultValues } from './migrationUtils';
import { Tags } from '../../lib/collections/tags/collection';

export default registerMigration({
  name: "adminOnlyTags",
  dateWritten: "2020-04-20",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Tags,
      fieldName: "adminOnly"
    });
  }
})
