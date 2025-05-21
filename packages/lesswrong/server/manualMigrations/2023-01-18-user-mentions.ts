import {registerMigration, fillDefaultValues} from './migrationUtils'
import {Users} from '../../server/collections/users/collection'

export default registerMigration({
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
