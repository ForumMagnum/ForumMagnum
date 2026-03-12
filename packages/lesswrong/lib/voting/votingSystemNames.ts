import { z } from "zod";

export const votingSystemNames = z.enum([
  'default',
  'twoAxis',
  'namesAttachedReactions',
  'reactionsAndLikes',
  'reactsBallot',
]);

export type VotingSystemName = z.infer<typeof votingSystemNames>;
