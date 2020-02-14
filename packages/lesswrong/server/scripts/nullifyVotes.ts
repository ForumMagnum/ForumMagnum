import Users from '../../lib/collections/users/collection';
import { Vulcan, runCallbacksAsync } from '../vulcan-lib';

Vulcan.nullifyVotesForNullifiedUsers = async () => {
  const users = await Users.find({nullifyVotes: true}).fetch();
  users.forEach((user) => {
    runCallbacksAsync('users.nullifyVotes.async', user);
  })
  //eslint-disable-next-line no-console
  console.warn(`Nullified votes for ${users.length} users`);
}
