import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';
import { Votes } from 'meteor/vulcan:voting';
import { getSetting } from 'meteor/vulcan:core';
import { Random } from 'meteor/random';
import { runCallbacksAsync } from 'meteor/vulcan:core';

Vulcan.nullifyVotesForNullifiedUsers = async () => {
  const users = await Users.find({nullifyVotes: true}).fetch();
  users.forEach((user) => {
    runCallbacksAsync('users.nullifyVotes.async', user);
  })
  console.log(`Nullified votes for ${users.length} users`);
}
