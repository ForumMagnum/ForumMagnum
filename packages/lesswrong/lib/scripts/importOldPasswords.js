/* global Vulcan */
import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';
import { createDummyMessage, createDummyConversation, createDummyPost, createDummyComment } from '../../testing/utils.js';
import { performSubscriptionAction } from '../subscriptions/mutations.js';

Vulcan.importLW1Passwords = async () =>
{
  const users = await Users.find({legacy: true, 'legacyData.password': {$exists: true}, 'services.password': {$exists: false}}).fetch();
  let userCounter = 0;
  users.forEach((user) => {
    userCounter++;
    Accounts.setPassword(user._id, user.legacyData.password);
    if(userCounter % 100 === 0) {
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
    Accounts.setPassword(user._id, user.legacyData.password);
    if(userCounter % 100 === 0) {
      console.log(userCounter);
    }
  })
}
