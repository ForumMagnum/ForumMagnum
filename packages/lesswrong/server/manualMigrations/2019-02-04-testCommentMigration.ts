import { Comments } from '../../lib/collections/comments/collection'
import { registerMigration, migrateDocuments } from './migrationUtils';


export default registerMigration({
  name: "testCommentMigration",
  dateWritten: "2019-02-04",
  idempotent: true,
  action: async () => {
    await migrateDocuments({
      description: "Checking how long migrating a lot of comments takes",
      collection: Comments,
      batchSize: 1000,
      unmigratedDocumentQuery: {
        schemaVersion: {$lt: 1}
      }, 
      migrate: async (documents) => {
        const updates = documents.map(comment => {
          return {
            updateOne: {
              filter: {_id: comment._id},
              update: {
                $set: {
                  testContents: {
                      originalContents: {
                          data: "htmlReference"
                      },
                      html: "htmlReference", 
                      version: "1.0.0", 
                      userId: "userIdReference", 
                      editedAt: "postedAtReference" 
                  },
                  schemaVersion: 1
                },
                
              }
            }
          }
        })
        await Comments.rawCollection().bulkWrite(
          updates,
          { ordered: false }
        );
      }
    })
  },
});
