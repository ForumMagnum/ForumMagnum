import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { Users } from '../../server/collections/users/collection';

const excludeOld = (partiallyReadSequences: Array<any>, dateCutoff: Date): Array<any> => {
  return partiallyReadSequences.filter(s=>s.lastReadTime >= dateCutoff);
}

export default registerMigration({
  name: "clearOldPartiallyReadSequences",
  dateWritten: "2020-06-08",
  idempotent: true,
  action: async () => {
    const thirtyDaysInMs = 30*24*60*60*1000;
    const dateCutoff = new Date(new Date().getTime() - thirtyDaysInMs)
    
    // eslint-disable-next-line no-console
    console.log(`Clearing continue-reading entries with a last-read time older than ${dateCutoff}`);
    
    await forEachDocumentBatchInCollection({
      collection: Users,
      batchSize: 1000,
      callback: async (users: Array<DbUser>) => {
        const updates: Array<any> = [];
        
        for (const user of users) {
          if (!user.partiallyReadSequences) continue;
          const newPartiallyRead = excludeOld(user.partiallyReadSequences, dateCutoff);
          
          updates.push({
            updateOne: {
              filter: { _id: user._id },
              update: {
                $set: {
                  partiallyReadSequences: newPartiallyRead,
                },
              },
            }
          });
        }
        
        await Users.rawCollection().bulkWrite(updates, { ordered: false });
      }
    });
    
    // eslint-disable-next-line no-console
    console.log("Done");
  }
})
