import { ReactionsAndLikesCommentBottom, ReactionsAndLikesVoteOnComment } from "@/components/votes/lwReactions/ReactionsAndLikesVote";
import { NamesAttachedReactionsCommentBottom, NamesAttachedReactionsVoteOnComment } from "@/components/votes/lwReactions/NamesAttachedReactionsVoteOnComment";
import EAEmojisVoteOnPost from "@/components/votes/EAEmojisVoteOnPost";
import EAEmojisVoteOnPostSecondary from "@/components/votes/EAEmojisVoteOnPostSecondary";
import VoteOnComment from "@/components/votes/VoteOnComment";
import TwoAxisVoteOnComment from "@/components/votes/TwoAxisVoteOnComment";
import ReactBallotVoteOnComment from "@/components/votes/ReactBallotVoteOnComment";
import EmojiReactionVoteOnComment from "@/components/votes/EmojiReactionVoteOnComment";
import EAEmojisVoteOnComment from "@/components/votes/EAEmojisVoteOnComment";
import type { VotingSystemName } from "./votingSystemNames";
import type { CommentVotingBottomComponent, CommentVotingComponent, PostVotingComponent } from './votingSystemTypes';

// These are split out from the voting system definitions because
// we use the voting system definitions on the server but not in SSR contexts,
// so there's no reason to blow up the size of the server bundle
// (also it causes turbopack to panic if we reach something that imports next/dynamic,
// see https://github.com/vercel/next.js/issues/77036)

export const commentVotingComponents = {
  default: () => VoteOnComment,
  twoAxis: () => TwoAxisVoteOnComment,
  reactsBallot: () => ReactBallotVoteOnComment,
  emojiReactions: () => EmojiReactionVoteOnComment,
  eaEmojis: () => EAEmojisVoteOnComment,
  reactionsAndLikes: () => ReactionsAndLikesVoteOnComment,
  namesAttachedReactions: () => NamesAttachedReactionsVoteOnComment,
} satisfies Record<VotingSystemName, () => CommentVotingComponent>;

export const commentBottomComponents: Partial<Record<VotingSystemName, () => CommentVotingBottomComponent>> = {
  reactionsAndLikes: () => ReactionsAndLikesCommentBottom,
  namesAttachedReactions: () => NamesAttachedReactionsCommentBottom,
};

export const postBottomVotingComponents: Partial<Record<VotingSystemName, () => PostVotingComponent>> = {
  eaEmojis: () => EAEmojisVoteOnPost,
};

export const postBottomSecondaryVotingComponents: Partial<Record<VotingSystemName, () => PostVotingComponent>> = {
  eaEmojis: () => EAEmojisVoteOnPostSecondary,
};
