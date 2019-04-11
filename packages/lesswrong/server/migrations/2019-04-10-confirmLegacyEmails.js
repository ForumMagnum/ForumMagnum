import { registerMigration } from './migrationUtils';
import { forEachDocumentBatchInCollection } from '../queryUtil.js';
import Users from 'meteor/vulcan:users';

registerMigration({
  name: "confirmLegacyEmails",
  idempotent: true,
  action: async () => {
    forEachDocumentBatchInCollection({
      collection: Users,
      batchSize: 1000,
      callback: (users) => {
        let updates = [];
        
        // For users that were on old LessWrong...
        for(let user of users)
        {
          const legacyData = user.legacyData;
          for (let i=0; i<user.emails.length; i++) {
            const email = user.emails[i];
            if (legacyData && email
                // If their email address was verified...
                && legacyData.has_subscribed === "t"
                // And is still the same email address as before...
                && legacyData.email === email.address
                // And they haven't re-verified...
                && !email.verified)
            {
              // Then mark their email address as verified.
              updates.push({
                updateOne: {
                  filter: {_id: user._id},
                  update: {
                    $set: {
                      [`emails[${i}].verified`]: true
                    }
                  }
                }
              });
            }
          }
        }
        
        Users.rawCollection().bulkWrite(updates, { ordered: false });
      }
    });
  },
});