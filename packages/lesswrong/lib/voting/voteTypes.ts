export const votingSystems = ["Classic", "TwoFactorAgree"] as const
export type VotingSystemString = typeof  votingSystems[number]

export const isVotingSystem = (str: string): str is VotingSystemString => {
  return !!votingSystems.find((votingSystem) => str === votingSystem)
}

export const voteDimensions = ["Overall", "Agreement"] as const
export type VoteDimensionString = typeof voteDimensions[number] //"Overall" | "Agreement"

export type VoteTypesRecordType = Partial<Record<VoteDimensionString, string|null>>
export type PowersRecordType = Partial<Record<VoteDimensionString, number|null>>

interface VoteTypeOptions {
  power: number|((user: DbUser|UsersCurrent, document: VoteableType)=>number),
}


export const calculateVotePower = (karma: number, voteType: string): number => {
  if (voteType == "smallUpvote") { return userSmallVotePower(karma, 1)}
  if (voteType == "smallDownvote") { return userSmallVotePower(karma, -1)}
  if (voteType == "bigUpvote") { return userBigVotePower(karma, 1)}
  if (voteType == "bigDownvote") { return userBigVotePower(karma, -1)}
  if (voteType === null) { return 0 }
  else throw new Error("Invalid vote type");
}

export const userSmallVotePower = (karma: number, multiplier: number) => {
  if (karma >= 1000) { return 2 * multiplier }
  return 1 * multiplier
}

export const userBigVotePower = (karma: number, multiplier: number) => {
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

// Define voting operations
export const voteTypes: Partial<Record<string,VoteTypeOptions>> = {
  smallUpvote: {
    power: (user: DbUser|UsersCurrent) => userSmallVotePower(user.karma, 1),
  },
  smallDownvote: {
    power: (user: DbUser|UsersCurrent) => userSmallVotePower(user.karma, -1),
  },
  bigUpvote: {
    power: (user: DbUser|UsersCurrent) => userBigVotePower(user.karma, 1),
  },
  bigDownvote: {
    power: (user: DbUser|UsersCurrent) => userBigVotePower(user.karma, -1),
  },
  null: {
    power: 0
  }
}
