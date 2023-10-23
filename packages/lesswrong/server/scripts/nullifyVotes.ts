import Users from '../../lib/collections/users/collection';
import { Globals } from '../vulcan-lib';
import { nullifyVotesForUser, nullifyVotesForUserByTarget } from '../callbacks';

Globals.nullifyVotesForNullifiedUsers = async () => {
  const users = await Users.find({nullifyVotes: true}).fetch();
  users.forEach((user) => {
    void nullifyVotesForUser(user);
  })
  //eslint-disable-next-line no-console
  console.warn(`Nullified votes for ${users.length} users`);
}

interface DateRangeInput {
  after?: string;
  before?: string;
}

Globals.nullifyVotesForUserByTarget = async (sourceUserId: string, targetUserId: string, dateRange: DateRangeInput = {}) => {
  let afterDate = undefined;
  let beforeDate = undefined;

  if (dateRange.after) {
    afterDate = new Date(dateRange.after);
    if (isNaN(afterDate.getTime())) throw new Error('Invalid after date provided!');
  }

  if (dateRange.before) {
    beforeDate = new Date(dateRange.before);
    if (isNaN(beforeDate.getTime())) throw new Error('Invalid before date provided!');
  }

  const sourceUser = await Users.findOne(sourceUserId);
  if (!sourceUser) throw new Error(`Couldn't find a source user with _id ${sourceUserId}`);
  await nullifyVotesForUserByTarget(sourceUser, targetUserId, { after: afterDate, before: beforeDate });
}
