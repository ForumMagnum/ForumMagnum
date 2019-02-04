import { Comments } from '../../lib/collections/comments'
import { registerMigration, migrateDocuments } from './migrationUtils';


registerMigration({
  name: "testCommentMigration",
  idempotent: true,
  action: async () => {
    await migrateDocuments({
      description: "Checking how long migrating a lot of comments takes",
      collection: Comments,
      batchSize: 1000,
      unmigratedDocumentQuery: {}, 
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
                  }
                }
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