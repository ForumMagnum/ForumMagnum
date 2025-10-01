import { z } from "zod";

export const votingSystemNames = z.enum([
  'default',
  'twoAxis',
  'namesAttachedReactions',
  'reactionsAndLikes',
  'reactsBallot',
  'emojiReactions',
  'eaEmojis',
  'message',
]);

export type VotingSystemName = z.infer<typeof votingSystemNames>;
