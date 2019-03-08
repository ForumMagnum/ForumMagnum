import { registerMigration, migrateDocuments, dropUnusedField } from './migrationUtils';
import { Posts } from '../../lib/collections/posts';



registerMigration({
  name: "scoreExceededDateFalseToNull",
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
        migrate: async (documents) => {
          let updates = [];
          for (let doc of documents) {
            updates.push({
              updateOne: {
                filter: { _id: doc._id },
                update: {
                  $set: {
                    [fieldName]: null
                  }
                }
              }
            });
          }
          await Posts.rawCollection().bulkWrite(updates, { ordered: false });
        },
      });
    }
  }
});

registerMigration({
  name: "dropUnusedFields1",
  idempotent: true,
  action: async () => {
    await dropUnusedField(Posts, "content");
  }
});
