import { z } from "zod";

export const votingSystemNames = z.enum([
  'default',
  'twoAxis',
  'namesAttachedReactions',
  'reactionsAndLikes',
  'reactsBallot',
  'emojiReactions',
  'eaEmojis',
]);

export type VotingSystemName = z.infer<typeof votingSystemNames>;
