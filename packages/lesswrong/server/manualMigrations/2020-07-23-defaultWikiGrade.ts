
import { registerMigration, fillDefaultValues } from './migrationUtils';
import { Tags } from '../../lib/collections/tags/collection';

registerMigration({
  name: "defaultWikiGrade",
  dateWritten: "2020-07-23",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Tags,
      fieldName: "wikiGrade",
    });
  }
})
