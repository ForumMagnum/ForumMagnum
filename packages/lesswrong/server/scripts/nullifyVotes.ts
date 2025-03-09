import Users from '../../server/collections/users/collection';
import { nullifyVotesForUserByTarget } from '../callbacks';
import VotesRepo from '../repos/VotesRepo';
import { Votes } from '../../server/collections/votes/collection';
import { createAdminContext } from "../vulcan-lib/query";
import { nullifyVotesForUser, silentlyReverseVote } from '../voteServer';

// Exported to allow running manually with "yarn repl"
export const nullifyVotesForNullifiedUsers = async () => {
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

// Exported to allow running manually with "yarn repl"
export const wrappedNullifyVotesForUserByTarget = async (sourceUserId: string, targetUserId: string, dateRange: DateRangeInput = {}) => {
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

/**
 * Nullify votes where both user1 and user2 voted on the same document, this is intended for
 * nullifying duplicate votes from someone using an alt account.
 * Exported to allow running manually with "yarn repl"
 */
export const nullifySharedVotesForUsers = async (user1Id: string, user2Id: string, dryRun = false) => {
  const voteIds = await(new VotesRepo()).getSharedVoteIds({ user1Id, user2Id });
  const votes = await Votes.find({ _id: { $in: voteIds } }, { sort: { votedAt: -1 } }).fetch();

  // eslint-disable-next-line no-console
  console.log(`Found ${votes.length} votes where ${user1Id} and ${user2Id} voted on the same document`);

  const context = await createAdminContext();

  if (dryRun) return;

  for (const vote of votes) {
    //eslint-disable-next-line no-console
    console.log("reversing vote: ", vote);
    await silentlyReverseVote(vote, context);
  }

  //eslint-disable-next-line no-console
  console.log(`Reversed ${votes.length} votes where ${user1Id} and ${user2Id} voted on the same document`);
}
