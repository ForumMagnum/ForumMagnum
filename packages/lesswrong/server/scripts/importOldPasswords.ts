import { Vulcan } from '../../lib/vulcan-lib';
import Users from '../../lib/collections/users/collection';
import { Accounts } from '../../lib/meteorAccounts';

Vulcan.importLW1Passwords = async () =>
{
  const users = await Users.find({legacy: true, 'legacyData.password': {$exists: true}, 'services.password': {$exists: false}}).fetch();
  let userCounter = 0;
  users.forEach((user) => {
    userCounter++;
    // @ts-ignore legacyData not handled right in the schema
    Accounts.setPassword(user._id, user.legacyData.password);
    if(userCounter % 100 === 0) {
      //eslint-disable-next-line no-console
      console.log(userCounter);
    }
  })
}


Vulcan.importLW1Passwords2 = async () =>
{
  const users = await Users.find({legacy: true, 'legacyData.password': {$exists: true}, 'services.password': {}}).fetch();
  let userCounter = 0;
  users.forEach((user) => {
    userCounter++;
    // @ts-ignore legacyData not handled right in the schema
    Accounts.setPassword(user._id, user.legacyData.password);
    if(userCounter % 100 === 0) {
      //eslint-disable-next-line no-console
      console.log(userCounter);
    }
  })
}
