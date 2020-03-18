import React from 'react';
import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { defaultFilterSettings } from '../../lib/filterSettings';
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
        let changes: Array<any> = [];
        
        for (let user of users) {
          changes.push({
            updateOne: {
              filter: { _id: user._id },
              update: {
                $set: {
                  frontpageFilterSettings: {
                    ...defaultFilterSettings,
                    personalBlog: (user.currentFrontpageFilter === "frontpage") ? "Hidden" : "Default"
                  }
                }
              }
            }
          });
        }
        
        await Users.rawCollection().bulkWrite(changes, { ordered: false });
      }
    });
  }
});
