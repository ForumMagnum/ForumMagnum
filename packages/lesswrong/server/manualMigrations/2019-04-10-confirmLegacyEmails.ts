import { forEachDocumentBatchInCollection, registerMigration } from './migrationUtils';
import Users from '../../server/collections/users/collection';
import { backgroundTask } from '../utils/backgroundTask';

export default registerMigration({
  name: "confirmLegacyEmails",
  dateWritten: "2019-04-10",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Users,
      batchSize: 1000,
      callback: (users: DbUser[]) => {
        let updates: Array<any> = [];
        
        for(let user of users)
        {
          // If the user is not a legacy user, no change
          if (!user || !user.legacy || !(user as any).legacyData)
            continue;
          
          // Because all emails were verified on import, if the email address
          // is unverified, that means verification was cleared (eg by an email
          // address change) on import.
          if (user.emails?.some((email: any) => !email.verified))
            continue;
          
          // If user.whenConfirmationEmailSent, either the email address was unnecessarily re-verified, or the email
          // was un-verified by changing email address and then re-verified. Or a verification email was sent but not
          // clicked; that case is hard to distinguish. In any case, leave things as-is.
          if (user.whenConfirmationEmailSent)
            continue;
          
          // If the user has no email address, no change
          if (!user.emails) continue;

          // If the email address matches legacyData.emailAddress, set its verified flag to legacyData.email_validated.
          const legacyData = (user as any).legacyData;
          for (let i=0; i<user.emails.length; i++) {
            if (legacyData.email
              && user.emails && user.emails[i].address === legacyData.email)
            {
              const shouldBeVerified = legacyData.email_validated;
              if(user.emails[i].verified !== shouldBeVerified) {
                updates.push({
                  updateOne: {
                    filter: {_id: user._id},
                    update: {
                      $set: {
                        [`emails[${i}].verified`]: shouldBeVerified
                      }
                    }
                  }
                });
              }
            }
          }
        }
        
        backgroundTask(Users.rawCollection().bulkWrite(updates, { ordered: false }));
      }
    });
  },
});
