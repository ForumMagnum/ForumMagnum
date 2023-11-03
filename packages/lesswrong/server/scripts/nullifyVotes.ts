import Users from '../../lib/collections/users/collection';
import { Globals, createAdminContext } from '../vulcan-lib';
import { nullifyVotesForUser, nullifyVotesForUserByTarget, reverseVote } from '../callbacks';
import { VotesRepo } from '../repos';
import { Votes } from '../../lib/collections/votes';

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

Globals.nullifySharedVotesForUsers = async (user1Id: string, user2Id: string, dryRun = false) => {
  const voteIds = await(new VotesRepo()).getSharedVoteIds({ user1Id, user2Id });
  const votes = await Votes.find({ _id: { $in: voteIds } }, { sort: { votedAt: -1 } }).fetch();

  // eslint-disable-next-line no-console
  console.log(`Found ${votes.length} shared votes between ${user1Id} and ${user2Id}`);

  const context = await createAdminContext();

  if (dryRun) return;

  // for (const vote of votes) {
  //   await reverseVote(vote, context);
  // }
}
