import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import Users from '../../server/collections/users/collection';


export default registerMigration({
  name: "fixLegacyJoinDates",
  dateWritten: "2019-11-25",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Users,
      filter: { legacyData: {$exists: true} },
      callback: async (users: DbUser[]) => {
        let changes: Array<any> = [];
        for (let user of users) {
          const legacyJoinDate = (user as any).legacyData?.date && new Date((user as any).legacyData?.date);
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
