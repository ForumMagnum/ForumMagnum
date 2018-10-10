import { addVoteType } from 'meteor/vulcan:voting';
// LESSWRONG – Added userSmallVotePower and userBigVotePower

export const getVotePower = (karma, voteType) => {
  if (voteType == "smallUpvote") { return userSmallVotePower(karma, 1)}
  if (voteType == "smallDownvote") { return userSmallVotePower(karma, -1)}
  if (voteType == "bigUpvote") { return userBigVotePower(karma, 1)}
  if (voteType == "bigDownvote") { return userBigVotePower(karma, -1)}
}

export const userSmallVotePower = (karma, multiplier) => {
  if (karma >= 25000) { return 3 * multiplier }
  if (karma >= 1000) { return 2 * multiplier }
  return 1 * multiplier
}

export const userBigVotePower = (karma, multiplier) => {
  if (karma >= 500000) { return 16 * multiplier } // Thousand year old vampire
  if (karma >= 250000) { return 15 * multiplier }
  if (karma >= 175000) { return 14 * multiplier }
  if (karma >= 100000) { return 13 * multiplier }
  if (karma >= 75000) { return 12 * multiplier }
  if (karma >= 50000) { return 11 * multiplier }
  if (karma >= 25000) { return 10 * multiplier }
  if (karma >= 10000) { return 9 * multiplier }
  if (karma >= 5000) { return 8 * multiplier }
  if (karma >= 2500) { return 7 * multiplier }
  if (karma >= 1000) { return 6 * multiplier }
  if (karma >= 500) { return 5 * multiplier }
  if (karma >= 250) { return 4 * multiplier }
  if (karma >= 100) { return 3 * multiplier }
  if (karma >= 10) { return 2 * multiplier }
  return 1 * multiplier
}

addVoteType('smallUpvote', {power: (user) => userSmallVotePower(user.karma, 1), exclusive: true});
addVoteType('smallDownvote', {power: (user) => userSmallVotePower(user.karma, -1), exclusive: true});
addVoteType('bigUpvote', {power: (user) => userBigVotePower(user.karma, 1), exclusive: true});
addVoteType('bigDownvote', {power: (user) => userBigVotePower(user.karma, -1), exclusive: true});
