import React from 'react';
import { Components } from '../vulcan-lib/components';
import { calculateVotePower } from './voteTypes';
import { loadByIds } from '../loaders';
import { filterNonnull } from '../utils/typeGuardUtils';
import { getVoteAxisStrength, registerVotingSystem } from './votingSystems';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { namesAttachedReactionsByName } from './reactions';
import uniq from 'lodash/uniq';
import keyBy from 'lodash/keyBy';
import some from 'lodash/some';
import mapValues from 'lodash/mapValues';
import sumBy from 'lodash/sumBy'
import sortBy from 'lodash/sortBy';
import { isLW } from '../instanceSettings';

export const addNewReactKarmaThreshold = new DatabasePublicSetting("reacts.addNewReactKarmaThreshold", 100);
export const addNameToExistingReactKarmaThreshold = new DatabasePublicSetting("reacts.addNameToExistingReactKarmaThreshold", 20);
export const downvoteExistingReactKarmaThreshold = new DatabasePublicSetting("reacts.downvoteExistingReactKarmaThreshold", 20);

registerVotingSystem<NamesAttachedReactionsVote, NamesAttachedReactionsScore>({
  name: "namesAttachedReactions",
  userCanActivate: isLW,
  description: "Reacts (Two-axis plus Names-attached reactions)",
  getCommentVotingComponent: () => Components.NamesAttachedReactionsVoteOnComment,
  getCommentBottomComponent: () => Components.NamesAttachedReactionsCommentBottom,
  addVoteClient: ({voteType, document, oldExtendedScore, extendedVote, currentUser}: {
    voteType: string|null,
    document: VoteableTypeClient,
    oldExtendedScore: NamesAttachedReactionsScore,
    extendedVote: NamesAttachedReactionsVote,
    currentUser: UsersCurrent
  }): NamesAttachedReactionsScore => {
    const newAgreementPower = calculateVotePower(currentUser.karma, extendedVote?.agreement||"neutral");
    const oldApprovalVoteCount = (oldExtendedScore && "approvalVoteCount" in oldExtendedScore) ? oldExtendedScore.approvalVoteCount : document.voteCount;
    const newVoteIncludesApproval = (voteType&&voteType!=="neutral");
    const newReacts = addReactsVote(oldExtendedScore?.reacts, extendedVote?.reacts??[], currentUser);
    
    return {
      approvalVoteCount: oldApprovalVoteCount + (newVoteIncludesApproval?1:0),
      agreement: (oldExtendedScore?.agreement||0) + newAgreementPower,
      agreementVoteCount: (oldExtendedScore?.agreementVoteCount||0) + 1,
      reacts: newReacts,
    };
  },
  cancelVoteClient: ({voteType, document, oldExtendedScore, cancelledExtendedVote, currentUser}: {voteType: string|null, document: VoteableTypeClient, oldExtendedScore: any, cancelledExtendedVote: any, currentUser: UsersCurrent}): any => {
    const oldVoteAgreement: string | undefined = cancelledExtendedVote?.agreement;
    const oldVoteIncludesAgreement = (oldVoteAgreement && oldVoteAgreement!=="neutral");
    const oldAgreementPower = oldVoteIncludesAgreement ? calculateVotePower(currentUser.karma, oldVoteAgreement) : 0;
    const oldApprovalVoteCount = (oldExtendedScore && "approvalVoteCount" in oldExtendedScore) ? oldExtendedScore.approvalVoteCount : document.voteCount;
    const oldVoteIncludesApproval = (voteType&&voteType!=="neutral");
    const newReacts = removeReactsVote(oldExtendedScore?.reacts, currentUser);
    
    return {
      approvalVoteCount: oldApprovalVoteCount - (oldVoteIncludesApproval?1:0),
      agreement: (oldExtendedScore?.agreement||0) - (oldVoteIncludesAgreement?oldAgreementPower:0),
      agreementVoteCount: (oldExtendedScore?.agreementVoteCount||0) - (oldVoteIncludesAgreement?1:0),
      reacts: newReacts,
    };
  },
  computeExtendedScore: async (votes: DbVote[], context: ResolverContext) => {
    const userIdsThatVoted = uniq(votes.map(v=>v.userId));
    const usersThatVoted = await loadByIds(context, "Users", userIdsThatVoted);
    const usersById = keyBy(filterNonnull(usersThatVoted), u=>u._id);
    
    let mergedReacts: NamesAttachedReactionsList = {};
    for (let vote of votes) {
      const extendedVote: NamesAttachedReactionsVote|null = vote.extendedVoteType;
      const userInfo = {
        userId: vote.userId,
        displayName: usersById[vote.userId].displayName,
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
    
    return {
      approvalVoteCount: votes.filter(v=>(v.voteType && v.voteType!=="neutral")).length,
      agreement: sumBy(votes, v=>getVoteAxisStrength(v, usersById, "agreement")),
      agreementVoteCount: votes.filter(v=>getVoteAxisStrength(v, usersById, "agreement") !== 0).length,
      reacts: mergedReacts,
    };
  },

  isAllowedExtendedVote: (user: UsersCurrent|DbUser, document: DbVoteableType, oldExtendedScore: NamesAttachedReactionsScore, extendedVote: NamesAttachedReactionsVote) => {
    // Are there any reacts in this vote?
    if (extendedVote?.reacts && extendedVote.reacts.length>0) {
      // Users cannot antireact to reactions on their own comments
      if (some(extendedVote.reacts, r=>r.vote==="disagreed")) {
        if (user._id===document.userId) {
          return {allowed: false, reason: `You cannot antireact to reactions on your own comments`};
        }
      }
      

      // If the user is disagreeing with a react, they need at least
      // downvoteExistingReactKarmaThreshold karma
      if (user.karma < downvoteExistingReactKarmaThreshold.get()
        && some(extendedVote.reacts, r=>r.vote==="disagreed"))
      {
        return {allowed: false, reason: `You need at least ${addNameToExistingReactKarmaThreshold.get()} karma to antireact`};
      }

      // If the user is using any react at all, they need at least
      // existingReactKarmaThreshold karma for it to be a valid vote.
      if (user.karma<addNameToExistingReactKarmaThreshold.get()) {
        return {allowed: false, reason: `You need at least ${addNameToExistingReactKarmaThreshold.get()} karma to use reacts`};
      }
      
      // If the user is using a react which no one else has used on this comment
      // before, they need at least newReactKarmaThreshold karma for it to be a
      // valid vote.
      if (user.karma<addNewReactKarmaThreshold.get()) {
        for (let reaction of extendedVote.reacts) {
          if (!(reaction.react in oldExtendedScore.reacts)) {
            return {allowed: false, reason: `You need at least ${addNewReactKarmaThreshold.get()} karma to be the first to use a new react on a given comment`};
          }
        }
      }
      
      // There should be no duplicate entries in the list of reactions
      const reactionTypesUsed: EmojiReactName[] = extendedVote.reacts.map(r=>r.react);
      if (uniq(reactionTypesUsed).length !== reactionTypesUsed.length) {
        return {allowed: false, reason: "Duplicate reaction detected"};
      }

      // All reactions used should be reactions that exist
      for (let reaction of extendedVote.reacts) {
        if (!(reaction.react in namesAttachedReactionsByName)) {
          return {allowed: false, reason: `Unrecognized reaction: ${reaction.react}`};
        }
      }
    }

    return {allowed: true};
  },

  isNonblankExtendedVote: (vote: DbVote) => {
    return (vote?.extendedVoteType?.agreement && vote.extendedVoteType.agreement !== "neutral")
      || (vote?.extendedVoteType?.reacts && vote.extendedVoteType.reacts.length>0);
  },
});

export type EmojiReactName = string;
export type VoteOnReactionType = "created"|"seconded"|"disagreed";

export type UserVoteOnSingleReaction = {
  react: EmojiReactName
  vote: VoteOnReactionType
  quotes?: string[]
};
export type NamesAttachedReactionsVote = {
  agreement?: string,
  reacts?: UserVoteOnSingleReaction[]
}
export type UserReactInfo = {
  userId: string
  reactType: VoteOnReactionType
  displayName: string
  karma: number
  quotes?: string[]
}
export type NamesAttachedReactionsList = {
  [reactionType: EmojiReactName]: UserReactInfo[]|undefined
};
export type NamesAttachedReactionsScore = {
  approvalVoteCount: number,
  agreement: number,
  agreementVoteCount: number,
  reacts: NamesAttachedReactionsList,
};

function addReactsVote(
  old: NamesAttachedReactionsList|undefined,
  voteReacts: UserVoteOnSingleReaction[],
  currentUser: UsersCurrent
): NamesAttachedReactionsList {
  let updatedReactions = removeReactsVote(old, currentUser);
  const userInfo = {
    userId: currentUser._id,
    displayName: currentUser.displayName,
    karma: currentUser.karma,
  };
  if (voteReacts) {
    for (let reaction of voteReacts) {
      const userInfoWithType = {...userInfo, reactType: reaction.vote, quotes: reaction.quotes};
      if (updatedReactions[reaction.react])
        updatedReactions[reaction.react] = [...updatedReactions[reaction.react]!, userInfoWithType];
      else
        updatedReactions[reaction.react] = [userInfoWithType];
    }
  }
  return updatedReactions;
}

function removeReactsVote(old: NamesAttachedReactionsList|undefined, currentUser: UsersCurrent): NamesAttachedReactionsList {
  let updatedReactions: NamesAttachedReactionsList = old ? mapValues(old,
    (reactionsByType: UserReactInfo[]) => (
      reactionsByType.filter(userIdAndName => userIdAndName.userId !== currentUser._id)
    )
  ) : {};
  return updatedReactions;
}

export function reactionsListToDisplayedNumbers(reactions: NamesAttachedReactionsList|null, currentUserId: string|undefined): {react: EmojiReactName, numberShown: number}[] {
  if (!reactions)
    return [];

  let result: {react: EmojiReactName, numberShown: number}[] = [];
  for(let react of Object.keys(reactions)) {
    const netReaction = sumBy(reactions[react],
      r => r.reactType==="disagreed" ? -1 : 1
    );
    if (netReaction > 0 || some(reactions[react], r=>r.userId===currentUserId)) {
      result.push({
        react,
        numberShown: netReaction
      });
    }
  }
  
  return sortBy(result, r => -r.numberShown);
}
