import { registerMigration, migrateDocuments, dropUnusedField } from './migrationUtils';
import { Posts } from '../../lib/collections/posts/collection';
import * as _ from 'underscore';

registerMigration({
  name: "scoreExceededDateFalseToNull",
  dateWritten: "2019-03-07",
  idempotent: true,
  action: async () => {
    let fieldsToFix = [
      "scoreExceeded2Date",
      "scoreExceeded30Date",
      "scoreExceeded45Date",
      "scoreExceeded74Date"
    ];
    for (let fieldName of fieldsToFix) {
      await migrateDocuments({
        description: `${fieldName} false->null`,
        collection: Posts,
        unmigratedDocumentQuery: {
          [fieldName]: false,
        },
        batchSize: 1000,
        migrate: async (documents) => {
          let updates = _.map(documents, doc => ({
            updateOne: {
              filter: { _id: doc._id },
              update: {
                $set: {
                  [fieldName]: null
                }
              }
            }
          }));
         
          await Posts.rawCollection().bulkWrite(updates, { ordered: false });
        },
      });
    }
  }
});

registerMigration({
  name: "dropUnusedFields1",
  dateWritten: "2019-03-07",
  idempotent: true,
  action: async () => {
    await dropUnusedField(Posts, "content");
  }
});
