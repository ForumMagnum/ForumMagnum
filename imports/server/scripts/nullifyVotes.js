/* global Vulcan */
import Users from 'meteor/vulcan:users';
import { runCallbacksAsync } from 'meteor/vulcan:core';

Vulcan.nullifyVotesForNullifiedUsers = async () => {
  const users = await Users.find({nullifyVotes: true}).fetch();
  users.forEach((user) => {
    runCallbacksAsync('users.nullifyVotes.async', user);
  })
  //eslint-disable-next-line no-console
  console.warn(`Nullified votes for ${users.length} users`);
}
