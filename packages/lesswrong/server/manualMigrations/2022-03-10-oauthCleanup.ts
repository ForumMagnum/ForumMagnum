import { forEachDocumentInCollection, registerMigration } from './migrationUtils';
import { Users } from '../../lib/collections/users/collection';

export default registerMigration({
  name: "oauthCleanup",
  dateWritten: "2022-01-30",
  idempotent: true,
  action: async () => {
    await forEachDocumentInCollection({
      collection: Users,
      callback: async (user: DbUser) => {
        await maybeFixAccount(user);
      }
    });
  }
});

async function maybeFixAccount(user: DbUser): Promise<void> {
  // When:
  //  * The email field is populated with a sensible email address
  //  * The emails field is corrupt and exactly matches {0: {verified: true}}
  // This would have been created by an OAuth bug where the email field was populated
  // but the emails field was not, for GitHub and Facebook logins.
  // Fix them by setting the emails field to [{address: user.email, verified: true}]
  if (user.email && isSensibleEmail(user.email) && JSON.stringify(user.emails)==='{"0":{"verified":true}}') {
    // eslint-disable-next-line no-console
    console.log(`Fixing emails for ${user.slug}`);
    await Users.rawUpdateOne(
      {_id: user._id},
      {$set: {
        emails: [{address: user.email, verified: true}]
      }}
    );
    return;
  }
  
  // When:
  //  * There is a services.<oauthprovider>.id field that is an object
  //  * services.<oauthprovider>.id.id is a number or a string
  //  * There is not another user with that ID in services.<oauthprovider>.id
  // Move services.<oauthprovider>.id to services.<oauthprovider>
  // This would have been created by an OAuth bug where OAuth profiles merge
  // into the wrong field.
  for (let oauthProvider of ['google', 'facebook', 'github', 'auth0']) {
    if (user.services?.[oauthProvider]?.id?.id) {
      const realId = user.services[oauthProvider].id.id;
      if (typeof realId !== 'number' && typeof realId !== 'string') {
        // eslint-disable-next-line no-console
        console.log(`Can't fix user ${user.slug} with nested OAuth IDs: services.${oauthProvider}.id.id has wrong type`);
        return;
      }
      const otherUser = await Users.findOne({[`services.${oauthProvider}.id`]: realId});
      if (otherUser) {
        // eslint-disable-next-line no-console
        console.log(`Can't fix user ${user.slug} with nested OAuth IDs: services.${oauthProvider}.id is also taken by account ${otherUser.slug}`);
        return;
      }
      
      await Users.rawUpdateOne(
        {_id: user._id},
        {$set: {
          [`services.${oauthProvider}`]: user.services[oauthProvider].id,
        }}
      );
    }
  }
}

function isSensibleEmail(email: string): boolean {
  return typeof email === "string" && /.+@.*/.test(email);
}
