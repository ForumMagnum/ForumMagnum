import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import Users from '../../lib/collections/users/collection';


registerMigration({
  name: "fixLegacyJoinDates",
  dateWritten: "2019-11-25",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Users,
      filter: { legacyData: {$exists: true} },
      callback: async (users) => {
        let changes: Array<any> = [];
        for (let user of users) {
          const legacyJoinDate = user.legacyData?.date && new Date(user.legacyData?.date);
          const lw2joinDate = user.createdAt;
          
          if (legacyJoinDate && lw2joinDate && legacyJoinDate<lw2joinDate) {
            changes.push({
              updateOne: {
                filter: { _id: user._id },
                update: {
                  $set: {createdAt: legacyJoinDate}
                },
              },
            });
          }
        }
        if (changes.length > 0) {
          console.log(`Updating join dates for ${changes.length} users`); // eslint-disable-line
          await Users.rawCollection().bulkWrite(changes, { ordered: false });
        }
      }
    });
    console.log("Finished updating legacy user join dates"); // eslint-disable-line
  },
});
