import { VotingProps } from "@/components/votes/votingProps";
import { isLW } from "../instanceSettings";
import { Components } from "../vulcan-lib/components";
import { NamesAttachedReactionsList, UserVoteOnSingleReaction, addReactsVote, getDocumentHighlights, removeReactsVote } from "./namesAttachedReactions";
import { registerVotingSystem } from "./votingSystems";
import { loadByIds } from '../loaders';
import { filterNonnull } from '../utils/typeGuardUtils';
import keyBy from 'lodash/keyBy';
import uniq from 'lodash/uniq';
import { userGetDisplayName } from "../collections/users/helpers";
import sortBy from 'lodash/sortBy';
import type { TagLens } from "../arbital/useTagLenses";

/**
 * Reactions-and-likes voting
 */

type ReactionsAndLikesVote = {
  reacts?: UserVoteOnSingleReaction[]
}
export type LikesList = Array<{_id: string, displayName: string}>
type ReactionsAndLikesScore = {
  usersWhoLiked: LikesList
  reacts: NamesAttachedReactionsList
}

registerVotingSystem<ReactionsAndLikesVote, ReactionsAndLikesScore>({
  name: "reactionsAndLikes",
  userCanActivate: isLW,
  description: "Likes (single-axis non-anonymous) plus reactions",
  hasInlineReacts: true,

  getCommentVotingComponent: () => Components.ReactionsAndLikesVoteOnComment,
  getCommentBottomComponent: () => Components.ReactionsAndLikesCommentBottom,

  addVoteClient: ({voteType, document, oldExtendedScore, extendedVote, currentUser}: {
    voteType: string|null,
    document: VoteableTypeClient,
    oldExtendedScore: ReactionsAndLikesScore,
    extendedVote: ReactionsAndLikesVote,
    currentUser: UsersCurrent
  }): ReactionsAndLikesScore => {
    const newReacts = addReactsVote(oldExtendedScore?.reacts, extendedVote?.reacts??[], currentUser);
    const oldLikesList = oldExtendedScore?.usersWhoLiked ?? [];
    const updatedLikesList = oldLikesList //TODO: Client-side updating of the likes list
    
    return {
      usersWhoLiked: updatedLikesList,
      reacts: newReacts,
    };
  },
  cancelVoteClient: ({voteType, document, oldExtendedScore, cancelledExtendedVote, currentUser}: {voteType: string|null, document: VoteableTypeClient, oldExtendedScore: any, cancelledExtendedVote: any, currentUser: UsersCurrent}): any => {
    const newReacts = removeReactsVote(oldExtendedScore?.reacts, currentUser);
    const oldLikesList = oldExtendedScore?.usersWhoLiked ?? [];
    const updatedLikesList = oldLikesList; //TODO: Client-side updating of the likes list
    
    return {
      usersWhoLiked: updatedLikesList,
      reacts: newReacts,
    };
  },
  computeExtendedScore: async (votes: DbVote[], context: ResolverContext) => {
    const userIdsThatVoted = uniq(votes.map(v=>v.userId));
    const usersThatVoted = await loadByIds(context, "Users", userIdsThatVoted);
    const usersById = keyBy(filterNonnull(usersThatVoted), u=>u._id);
    
    let mergedReacts: NamesAttachedReactionsList = {};
    for (let vote of votes) {
      const extendedVote: ReactionsAndLikesVote|null = vote.extendedVoteType;
      const userInfo = {
        userId: vote.userId,
        displayName: usersById[vote.userId].displayName ?? "",
        karma: usersById[vote.userId].karma,
      };
      if (extendedVote?.reacts) {
        for (let reaction of extendedVote.reacts) {
          const userInfoWithType = {...userInfo, reactType: reaction.vote, quotes: reaction.quotes};
          if (mergedReacts[reaction.react]) {
            mergedReacts[reaction.react]!.push(userInfoWithType);
          } else {
            mergedReacts[reaction.react] = [userInfoWithType];
          }
        }
      }
    }
    
    const upvotes = votes.filter(v => (v.voteType === "smallUpvote" || v.voteType === "bigUpvote"))
    const upvotesByDescendingUserKarma = sortBy(upvotes, v => -usersById[v.userId].karma);
    
    // FIXME: userGetDisplayName differs between LW and AF; this will create a weird inconsistency in denormalized data based on whether the last vote was cast on LW or on AF
    const likesList = upvotesByDescendingUserKarma
      .map(v => ({_id: v.userId, displayName: userGetDisplayName(usersById[v.userId])}));
    
    return {
      usersWhoLiked: likesList,
      reacts: mergedReacts,
    };
  },
  
  isAllowedExtendedVote: ({user, document, oldExtendedScore, extendedVote, skipRateLimits}: {
    user: UsersCurrent|DbUser,
    document: DbVoteableType,
    oldExtendedScore: ReactionsAndLikesScore,
    extendedVote: ReactionsAndLikesVote,
    skipRateLimits?: boolean,
  }) => {
    // TODO: Call isVoteWithReactsAllowed (from namesAttachedReactions) and make it work with both voting systems
    return {allowed: true}; // TODO
  },

  isNonblankExtendedVote: (vote: DbVote) => {
    return true;
  },
  
  getCommentHighlights: ({comment, voteProps}: {
    comment: CommentsList
    voteProps: VotingProps<VoteableTypeClient>
  }) => {
    return getDocumentHighlights(voteProps);
  },
  
  getPostHighlights: ({post, voteProps}: {
    post: PostsBase
    voteProps: VotingProps<VoteableTypeClient>
  }) => {
    return getDocumentHighlights(voteProps);
  },
  getTagOrLensHighlights: ({tagOrLens, voteProps}: {
    tagOrLens: TagLens|TagPageFragment,
    voteProps: VotingProps<VoteableTypeClient>
  }) => {
    return getDocumentHighlights(voteProps);
  },
});

