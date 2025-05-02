import { registerMigration } from './migrationUtils';
import Users from '../../server/collections/users/collection';


export default registerMigration({
  name: "fillEmailsFieldForOrganizers",
  dateWritten: "2021-08-23",
  idempotent: true,
  action: async () => {
    const organizers = await Users.find({createdAt: {$gt: new Date("2021-08-22T05:48:35.336Z")}, emails: null}).fetch()
    for (const organizer of organizers) {
      if (organizer.email) {
        await Users.rawUpdateOne({_id: organizer._id}, {$set: {emails: [{address: organizer.email, verified: true}]}})
      }
    }
  },
});
