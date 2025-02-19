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
import { ContentReplacedSubstringComponentInfo } from '../../components/common/ContentItemBody';
import type { VotingProps } from '../../components/votes/votingProps';

export const addNewReactKarmaThreshold = new DatabasePublicSetting("reacts.addNewReactKarmaThreshold", 100);
export const addNameToExistingReactKarmaThreshold = new DatabasePublicSetting("reacts.addNameToExistingReactKarmaThreshold", 20);
export const downvoteExistingReactKarmaThreshold = new DatabasePublicSetting("reacts.downvoteExistingReactKarmaThreshold", 20);

registerVotingSystem<NamesAttachedReactionsVote, NamesAttachedReactionsScore>({
  name: "namesAttachedReactions",
  userCanActivate: isLW,
  description: "Reacts (Two-axis plus Names-attached reactions)",
  hasInlineReacts: true,
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
    
    return {
      approvalVoteCount: votes.filter(v=>(v.voteType && v.voteType!=="neutral")).length,
      agreement: sumBy(votes, v=>getVoteAxisStrength(v, usersById, "agreement")),
      agreementVoteCount: votes.filter(v=>getVoteAxisStrength(v, usersById, "agreement") !== 0).length,
      reacts: mergedReacts,
    };
  },

  isAllowedExtendedVote: ({ user, document, oldExtendedScore, extendedVote, skipRateLimits }: {
    user: UsersCurrent|DbUser,
    document: DbVoteableType,
    oldExtendedScore: NamesAttachedReactionsScore,
    extendedVote: NamesAttachedReactionsVote,
    skipRateLimits?: boolean,
  }) => {
    // Are there any reacts in this vote?
    if (extendedVote?.reacts && extendedVote.reacts.length>0) {
      return isVoteWithReactsAllowed({user, document, oldExtendedScore, extendedVote, skipRateLimits});
    }

    return {allowed: true};
  },

  isNonblankExtendedVote: (vote: DbVote) => {
    return (vote?.extendedVoteType?.agreement && vote.extendedVoteType.agreement !== "neutral")
      || (vote?.extendedVoteType?.reacts && vote.extendedVoteType.reacts.length>0);
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
  }
});

export function getDocumentHighlights(voteProps: VotingProps<VoteableTypeClient>): ContentReplacedSubstringComponentInfo[] {
  const normalizedReactionsScore = getNormalizedReactionsListFromVoteProps(voteProps);
  if (!normalizedReactionsScore?.reacts) {
    return [];
  }
  const reactionsByQuote: Record<string,NamesAttachedReactionsList> = {};
  
  for (let reactionType of Object.keys(normalizedReactionsScore.reacts)) {
    const userReactions = normalizedReactionsScore.reacts[reactionType]
    if (!userReactions) {
      continue;
    }
    for (let userReaction of userReactions) {
      if (userReaction.quotes) {
        for (let quote of userReaction.quotes) {
          if (!reactionsByQuote[quote]) {
            reactionsByQuote[quote] = {};
          }
          if (!reactionsByQuote[quote][reactionType]) {
            reactionsByQuote[quote][reactionType] = [];
          }
          reactionsByQuote[quote][reactionType]!.push(userReaction);
        }
      }
    }
  }
  
  const result: ContentReplacedSubstringComponentInfo[] = [];
  for (let quote of Object.keys(reactionsByQuote)) {
    result.push({
      replacedString: quote,
      componentName: 'InlineReactHoverableHighlight',
      replace: "first",
      props: {
        quote,
        reactions: reactionsByQuote[quote],
      }
    });
  }
  return result;
}

export function isVoteWithReactsAllowed({user, document, oldExtendedScore, extendedVote, skipRateLimits}: {
  user: UsersCurrent|DbUser,
  document: DbVoteableType,
  oldExtendedScore: NamesAttachedReactionsScore,
  extendedVote: NamesAttachedReactionsVote,
  skipRateLimits?: boolean,
}): {allowed: true}|{allowed: false, reason: string} {
  if (!extendedVote.reacts) {
    return {allowed: true};
  }

  // Users cannot antireact to reactions on their own comments
  if (some(extendedVote.reacts, r=>r.vote==="disagreed")) {
    if (user._id===document.userId) {
      return {allowed: false, reason: `You cannot antireact to reactions on your own comments`};
    }
  }
  
  const userKarma = user.karma;

  // If the user is disagreeing with a react, they need at least
  // downvoteExistingReactKarmaThreshold karma
  if (!skipRateLimits && userKarma < downvoteExistingReactKarmaThreshold.get()
    && some(extendedVote.reacts, r=>r.vote==="disagreed"))
  {
    return {allowed: false, reason: `You need at least ${downvoteExistingReactKarmaThreshold.get()} karma to antireact`};
  }

  // If the user is using any react at all, they need at least
  // existingReactKarmaThreshold karma for it to be a valid vote.
  if (!skipRateLimits && userKarma<addNameToExistingReactKarmaThreshold.get()) {
    return {allowed: false, reason: `You need at least ${addNameToExistingReactKarmaThreshold.get()} karma to use reacts`};
  }
  
  // If the user is using a react which no one else has used on this comment
  // before, they need at least newReactKarmaThreshold karma for it to be a
  // valid vote.
  if (!skipRateLimits && userKarma<addNewReactKarmaThreshold.get()) {
    for (let reaction of extendedVote.reacts) {
      if (!(reaction.react in oldExtendedScore.reacts)) {
        return {allowed: false, reason: `You need at least ${addNewReactKarmaThreshold.get()} karma to be the first to use a new react on a given comment`};
      }
    }
  }
  
  // There should be no duplicate entries in the list of reactions. Entries
  // are duplicates if their reaction-type and quote both match.
  // TODO: version below is wrong (checks only reaction type, not quote)
  /*const reactionTypesUsed: EmojiReactName[] = extendedVote.reacts.map(r=>r.react);
  if (uniq(reactionTypesUsed).length !== reactionTypesUsed.length) {
    return {allowed: false, reason: "Duplicate reaction detected"};
  }*/

  // All reactions used should be reactions that exist
  for (let reaction of extendedVote.reacts) {
    if (!(reaction.react in namesAttachedReactionsByName)) {
      return {allowed: false, reason: `Unrecognized reaction: ${reaction.react}`};
    }
  }
  
  return {allowed: true};
}

export type EmojiReactName = string;
export type VoteOnReactionType = "created"|"seconded"|"disagreed";
export type QuoteLocator = string;

export type UserVoteOnSingleReaction = {
  react: EmojiReactName
  vote: VoteOnReactionType

  //HACK: This isn't really an array. When writing to the DB, this array can
  //have at most one element. When reading from the DB, results must pass
  //through a normalization function that ensures this isn't a multi-element array.
  quotes?: QuoteLocator[]
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

  //HACK: This isn't really an array. When writing to the DB, this array can
  //have at most one element. When reading from the DB, results must pass
  //through a normalization function that ensures this isn't a multi-element array.
  quotes?: QuoteLocator[]
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

export function addReactsVote(
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

export function removeReactsVote(old: NamesAttachedReactionsList|undefined, currentUser: UsersCurrent): NamesAttachedReactionsList {
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


export function getNormalizedReactionsListFromVoteProps(voteProps: VotingProps<VoteableTypeClient>): NamesAttachedReactionsScore|undefined {
  const extendedScore = voteProps.document?.extendedScore as NamesAttachedReactionsScore|undefined;
  if (!extendedScore) return undefined;

  function normalizeReactsList(reacts: UserReactInfo[]|undefined): UserReactInfo[] {
    if (!reacts) return [];
    let normalizedReacts: UserReactInfo[] = [];
    for (let react of reacts) {
      if (!react.quotes || react.quotes.length<=1) {
        normalizedReacts.push(react);
      } else {
        for (let quote of react.quotes) {
          normalizedReacts.push({ ...react, quotes: [quote] });
        }
      }
    }
    return normalizedReacts;
  }
  let normalizedReacts: NamesAttachedReactionsList = mapValues(extendedScore.reacts,
    reactsList => normalizeReactsList(reactsList)
  );
  return {
    ...extendedScore,
    reacts: normalizedReacts,
  };
}

export function getNormalizedUserVoteFromVoteProps(voteProps: VotingProps<VoteableTypeClient>): NamesAttachedReactionsVote|undefined {
  const extendedVote = (voteProps.document?.currentUserExtendedVote) as NamesAttachedReactionsVote|undefined;
  if (!extendedVote) return undefined;
  
  let normalizedReacts: UserVoteOnSingleReaction[] = [];
  if (extendedVote.reacts) {
    for (let react of extendedVote.reacts) {
      if (!react.quotes || react.quotes.length<=1) {
        normalizedReacts.push(react);
      } else {
        for (let quote of react.quotes) {
          normalizedReacts.push({ ...react, quotes: [quote] });
        }
      }
    }
  }
  
  return {
    ...extendedVote,
    reacts: normalizedReacts,
  };
}
