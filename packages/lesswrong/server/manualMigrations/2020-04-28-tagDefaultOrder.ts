import { registerMigration, fillDefaultValues } from './migrationUtils';
import { Tags } from '../../lib/collections/tags/collection';

export default registerMigration({
  name: "defaultOrderTags",
  dateWritten: "2020-04-28",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Tags,
      fieldName: "defaultOrder"
    });
  }
})
