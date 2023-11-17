import {registerMigration, fillDefaultValues} from './migrationUtils'
import {Users} from '../../lib/collections/users/collection'

registerMigration({
  name: 'notificationNewMention',
  dateWritten: '2023-01-18',
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Users,
      fieldName: 'notificationNewMention',
    })
  },
})
