import { registerMigration, migrateDocuments } from './migrationUtils'
import Users from '../../server/collections/users/collection'
import * as _ from 'underscore';

export default registerMigration({
  name: "renameAllPostsSorting",
  dateWritten: "2019-06-13",
  idempotent: true,
  action: async () => {
    await migrateDocuments({
      description: "Rename user setting for allPosts sorting from view to sorting",
      collection: Users,
      batchSize: 1000,
      unmigratedDocumentQuery: {
        allPostsView: {$exists: true}
      },
      migrate: async (users: Array<any>) => {
        const updates = _.map(users, user => {
          return {
            updateOne: {
              filter: {_id: user._id},
              update: {
                $set: {allPostsSorting: user.allPostsView},
                $unset: {allPostsView: ""},
              },
            }
          }
        })
        await Users.rawCollection().bulkWrite(updates, {ordered: false})
      }
    })
  }
})
