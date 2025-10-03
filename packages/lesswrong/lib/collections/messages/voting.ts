import type { CollectionVoteOptions } from "../../make_voteable";

export const messageVotingOptions: CollectionVoteOptions = {
  timeDecayScoresCronjob: false,
  userCanVoteOn: (user: DbUser|null, message: DbMessage, voteType: string, extendedVote: any) => {
    if (!user) {
      return {fail: true, reason: 'You must be logged in to vote.'};
    }
    return {fail: false};
  }
};
