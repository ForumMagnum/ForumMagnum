
import { registerMigration, fillDefaultValues } from './migrationUtils';
import { Tags } from '../../lib/collections/tags/collection';

registerMigration({
  name: "defaultWikiOnly",
  dateWritten: "2020-09-03",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Tags,
      fieldName: "wikiOnly",
    });
  }
})
