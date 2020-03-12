import React from 'react';
import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import Users from '../../lib/collections/users/collection';

registerMigration({
  name: "updateUserDefaultTagFilterSettings",
  dateWritten: "2020-03-11",
  idempotent: true,
  action: async () => {
    forEachDocumentBatchInCollection({
      collection: Users,
      batchSize: 100,
      callback: async (users: Array<DbUser>) => {
        for (let user of users) {
          if (user.currentFrontpageFilter === "community") {
            // TODO
          } else {
            // TODO
          }
        }
      }
    });
  }
});
