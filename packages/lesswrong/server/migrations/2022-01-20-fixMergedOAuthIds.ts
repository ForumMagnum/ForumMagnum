import Users from "../../lib/collections/users/collection";
import { registerMigration } from "./migrationUtils";

const serviceProviderNames = ['google', 'facebook', 'github', 'auth0'] as const;

registerMigration({
  name: "fixMergedOAuthIds",
  dateWritten: "2022-01-20",
  idempotent: true,
  action: async () => {
    for (const serviceProviderName of serviceProviderNames) {
      const affectedUsers = await Users.find({
        [`services.${serviceProviderName}.id.id`]: { $exists: true },
      }).fetch();
      console.log(serviceProviderName, 'num affected', affectedUsers.length);
      for (const user of affectedUsers) {
        const actualProfile = user.services[serviceProviderName].id;
        const duplicateUsers = await Users.find({
          [`services.${serviceProviderName}.id`]: actualProfile.id,
        }).fetch();
        if (duplicateUsers.length > 0) {
          console.log('Duplicate user found with profile id:', user.services[serviceProviderName].id.id)
          console.log('User with merge bug:', user._id, user.email);
          for (const dupUser of duplicateUsers) {
            console.log('Duplicate:', dupUser._id, dupUser.email);
          }
        }

        // await Users.update({_id: user._id}, {$set: {
        //   [`services.${serviceProviderName}`]: actualProfile
        // }})
      }
    }
  }
});
