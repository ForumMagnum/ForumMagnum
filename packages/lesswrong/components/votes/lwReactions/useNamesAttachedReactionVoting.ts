import { NamesAttachedReactionsList, NamesAttachedReactionsVote, EmojiReactName, UserVoteOnSingleReaction, VoteOnReactionType, getNormalizedReactionsListFromVoteProps, getNormalizedUserVoteFromVoteProps, QuoteLocator } from '../../../lib/voting/namesAttachedReactions';
import type { VotingProps } from '../votingProps';
import { useCurrentUser } from '../../common/withUser';
import { useDialog } from '../../common/withDialog';
import filter from 'lodash/filter';
import orderBy from 'lodash/orderBy';

export const useNamesAttachedReactionsVoting = (voteProps: VotingProps<VoteableTypeClient>): {
  getCurrentUserReaction: (name: EmojiReactName, quote: QuoteLocator|null) => UserVoteOnSingleReaction|null,
  getCurrentUserReactionVote: (name: EmojiReactName, quote: QuoteLocator|null) => VoteOnReactionType|null,
  toggleReaction: (name: EmojiReactName, quote: QuoteLocator|null) => void
  setCurrentUserReaction: (name: EmojiReactName, reaction: VoteOnReactionType|null, quote: QuoteLocator|null) => void,
  getAlreadyUsedReactTypesByKarma: () => EmojiReactName[],
  getAlreadyUsedReacts: () => NamesAttachedReactionsList,
} => {
  const { openDialog } = useDialog()
  const currentUser = useCurrentUser()
  const currentUserExtendedVote = getNormalizedUserVoteFromVoteProps(voteProps) ?? null;
  
  /**
   * Given a reaction type, return the user's vote on the non-inline version of
   * it (or null if they haven't reacted or have only reacted inline).
   */
  function getCurrentUserReaction(name: EmojiReactName, quote: QuoteLocator|null): UserVoteOnSingleReaction|null {
    const reacts = currentUserExtendedVote?.reacts ?? [];
    for (let i=0; i<reacts.length; i++) {
      if (reactionVoteIsMatch(reacts[i], name, quote)) {
        return reacts[i];
      }
    }
    return null;
  }

  function getCurrentUserReactionVote(name: EmojiReactName, quote: QuoteLocator|null): VoteOnReactionType|null {
    const currentUserReaction = getCurrentUserReaction(name, quote);
    return currentUserReaction ? currentUserReaction.vote : null
  }

  function openLoginDialog() {
    openDialog({
      componentName: "LoginPopup",
      componentProps: {}
    })
  }

  async function toggleReaction(name: string, quote: QuoteLocator|null) {
    if (!currentUser) {
      openLoginDialog();
      return;
    }
    const shouldClearUserReaction = !!getCurrentUserReactionVote(name, quote);

    if (shouldClearUserReaction) {
      await clearCurrentUserReaction(name, quote);
    } else {
      const initialVote = "created"; //TODO: "created" vs "seconded"
      await addCurrentUserReaction(name, initialVote, quote);
    }
  }

  async function addCurrentUserReaction(reactionName: EmojiReactName, vote: VoteOnReactionType, quote: QuoteLocator|null) {
    if (!currentUser) {
      openLoginDialog();
      return;
    }
    
    const oldReacts = currentUserExtendedVote?.reacts ?? [];
    const newReacts: UserVoteOnSingleReaction[] = [
      ...filter(oldReacts, r => !reactionVoteIsMatch(r, reactionName, quote)),
      {
        react: reactionName,
        vote,
        quotes: quote ? [quote] : undefined,
      }
    ]
    const newExtendedVote: NamesAttachedReactionsVote = {
      ...currentUserExtendedVote,
      reacts: newReacts
    };

    await voteProps.vote({
      document: voteProps.document,
      voteType: voteProps.document.currentUserVote || null,
      extendedVote: newExtendedVote,
      currentUser,
    });
  }

  async function clearCurrentUserReaction(reactionName: string, quote: QuoteLocator|null) {
    if (!currentUser) {
      openLoginDialog();
      return;
    }

    const oldReacts = currentUserExtendedVote?.reacts ?? [];
    const newExtendedVote: NamesAttachedReactionsVote = {
      ...currentUserExtendedVote,
      reacts: filter(oldReacts, r => !reactionVoteIsMatch(r, reactionName, quote))
    };

    await voteProps.vote({
      document: voteProps.document,
      voteType: voteProps.document.currentUserVote || null,
      extendedVote: newExtendedVote,
      currentUser,
    });
  }

  async function setCurrentUserReaction(reactionName: string, reaction: VoteOnReactionType|null, quote: QuoteLocator|null) {
    if (reaction) {
      await addCurrentUserReaction(reactionName, reaction, quote);
    } else {
      await clearCurrentUserReaction(reactionName, quote);
    }
  }

  function getAlreadyUsedReacts(): NamesAttachedReactionsList {
    const reactionsScore = getNormalizedReactionsListFromVoteProps(voteProps);
    const alreadyUsedReactions: NamesAttachedReactionsList = reactionsScore?.reacts ?? {};
    return alreadyUsedReactions
  }

  function getAlreadyUsedReactTypesByKarma(): string[] {
    const alreadyUsedReactions = getAlreadyUsedReacts()
    const alreadyUsedReactionTypes: string[] = Object.keys(alreadyUsedReactions);
    const alreadyUsedReactionTypesByKarma = orderBy(alreadyUsedReactionTypes,
      r=> (alreadyUsedReactions[r]!.length>0) ? alreadyUsedReactions[r]![0].karma : 0
    );
    return alreadyUsedReactionTypesByKarma
  }

  return {
    getCurrentUserReaction, getCurrentUserReactionVote, toggleReaction, setCurrentUserReaction, getAlreadyUsedReactTypesByKarma, getAlreadyUsedReacts
  };
}

export function reactionVoteIsMatch(react: UserVoteOnSingleReaction, name: EmojiReactName, quote: QuoteLocator|null): boolean {
  if (react.react !== name)
    return false;
  if (quote) {
    return !!(react.quotes && react.quotes.indexOf(quote)>=0);
  } else {
    return !(react.quotes?.length);
  }
}
