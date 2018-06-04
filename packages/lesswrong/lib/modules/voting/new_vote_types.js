import { addVoteType } from 'meteor/vulcan:voting';
// LESSWRONG – Added userSmallVotePower and userBigVotePower

const userSmallVotePower = (user, multiplier) => {
  if (user.karma >= 25000) { return 3 * multiplier }
  if (user.karma >= 1000) { return 2 * multiplier }
  return 1 * multiplier
}

const userBigVotePower = (user, multiplier) => {
  if (user.karma >= 500000) { return 16 * multiplier } // Thousand year old vampire
  if (user.karma >= 250000) { return 15 * multiplier }
  if (user.karma >= 175000) { return 14 * multiplier }
  if (user.karma >= 100000) { return 13 * multiplier }
  if (user.karma >= 75000) { return 12 * multiplier }
  if (user.karma >= 50000) { return 11 * multiplier }
  if (user.karma >= 25000) { return 10 * multiplier }
  if (user.karma >= 10000) { return 9 * multiplier }
  if (user.karma >= 5000) { return 8 * multiplier }
  if (user.karma >= 2500) { return 7 * multiplier }
  if (user.karma >= 1000) { return 6 * multiplier }
  if (user.karma >= 500) { return 5 * multiplier }
  if (user.karma >= 250) { return 4 * multiplier }
  if (user.karma >= 100) { return 3 * multiplier }
  if (user.karma >= 10) { return 2 * multiplier }
  return 1 * multiplier
}

addVoteType('smallUpvote', {power: (user) => userSmallVotePower(user, 1), exclusive: true});
addVoteType('smallDownvote', {power: (user) => userSmallVotePower(user, -1), exclusive: true});
addVoteType('bigUpvote', {power: (user) => userBigVotePower(user, 1), exclusive: true});
addVoteType('bigDownvote', {power: (user) => userBigVotePower(user, -1), exclusive: true});
