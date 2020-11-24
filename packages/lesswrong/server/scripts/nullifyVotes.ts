import Users from '../../lib/collections/users/collection';
import { Vulcan } from '../vulcan-lib';
import { nullifyVotesForUser } from '../callbacks';

Vulcan.nullifyVotesForNullifiedUsers = async () => {
  const users = await Users.find({nullifyVotes: true}).fetch();
  users.forEach((user) => {
    void nullifyVotesForUser(user);
  })
  //eslint-disable-next-line no-console
  console.warn(`Nullified votes for ${users.length} users`);
}
