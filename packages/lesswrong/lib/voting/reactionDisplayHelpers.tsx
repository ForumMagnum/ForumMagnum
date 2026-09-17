import type { VotingProps } from '@/components/votes/votingProps';
import type { NamesAttachedReactionsList, EmojiReactName, NamesAttachedReactionsScore, UserReactInfo, NamesAttachedReactionsVote, UserVoteOnSingleReaction, QuoteLocator } from './namesAttachedReactions';
import sumBy from 'lodash/sumBy';
import some from 'lodash/some';
import sortBy from 'lodash/sortBy';
import mapValues from 'lodash/mapValues';
import type { ContentReplacedSubstringComponentInfo } from '@/components/contents/contentBodyUtil';

export function normalizeReactionQuote(quote: QuoteLocator): QuoteLocator {
  // ContentItemBody applies this same normalization before locating a quote in
  // the rendered document. Keep quote identity consistent with that lookup so
  // whitespace variants don't create nested highlights on the same text.
  return quote.trim().replace(/\r/g, '');
}

export function normalizeQuotedReactions<T extends { quotes?: QuoteLocator[] }>(reacts: T[] | undefined): T[] {
  if (!reacts) return [];

  const normalizedReacts: T[] = [];
  for (const react of reacts) {
    if (!react.quotes?.length) {
      normalizedReacts.push(react);
    } else {
      for (const quote of react.quotes) {
        normalizedReacts.push({
          ...react,
          quotes: [normalizeReactionQuote(quote)],
        });
      }
    }
  }
  return normalizedReacts;
}

export function reactionsListToDisplayedNumbers(reactions: NamesAttachedReactionsList | null, currentUserId: string | undefined): { react: EmojiReactName; numberShown: number; }[] {
  if (!reactions)
    return [];

  let result: { react: EmojiReactName; numberShown: number; }[] = [];
  for (let react of Object.keys(reactions)) {
    const netReaction = sumBy(reactions[react],
      r => r.reactType === "disagreed" ? -1 : 1
    );
    if (netReaction > 0 || some(reactions[react], r => r.userId === currentUserId)) {
      result.push({
        react,
        numberShown: netReaction
      });
    }
  }

  return sortBy(result, r => -r.numberShown);
}


export function getNormalizedReactionsListFromVoteProps(voteProps: VotingProps<VoteableTypeClient>): NamesAttachedReactionsScore | undefined {
  const extendedScore = voteProps.document?.extendedScore as NamesAttachedReactionsScore | undefined;
  if (!extendedScore) return undefined;

  let normalizedReacts: NamesAttachedReactionsList = mapValues(extendedScore.reacts,
    reactsList => normalizeQuotedReactions<UserReactInfo>(reactsList)
  );
  return {
    ...extendedScore,
    reacts: normalizedReacts,
  };
}

export function getNormalizedUserVoteFromVoteProps(voteProps: VotingProps<VoteableTypeClient>): NamesAttachedReactionsVote | undefined {
  const extendedVote = (voteProps.document?.currentUserExtendedVote) as NamesAttachedReactionsVote | undefined;
  if (!extendedVote) return undefined;

  const normalizedReacts = normalizeQuotedReactions<UserVoteOnSingleReaction>(extendedVote.reacts);

  return {
    ...extendedVote,
    reacts: normalizedReacts,
  };
}

export function getDocumentHighlights(voteProps: VotingProps<VoteableTypeClient>): ContentReplacedSubstringComponentInfo[] {
  const normalizedReactionsScore = getNormalizedReactionsListFromVoteProps(voteProps);
  if (!normalizedReactionsScore?.reacts) {
    return [];
  }
  const reactionsByQuote: Record<string, NamesAttachedReactionsList> = {};

  for (let reactionType of Object.keys(normalizedReactionsScore.reacts)) {
    const userReactions = normalizedReactionsScore.reacts[reactionType];
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

export function addReactsVote(
  old: NamesAttachedReactionsList | undefined,
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
      const userInfoWithType = { ...userInfo, reactType: reaction.vote, quotes: reaction.quotes };
      if (updatedReactions[reaction.react])
        updatedReactions[reaction.react] = [...updatedReactions[reaction.react]!, userInfoWithType];

      else
        updatedReactions[reaction.react] = [userInfoWithType];
    }
  }
  return updatedReactions;
}

export function removeReactsVote(old: NamesAttachedReactionsList | undefined, currentUser: UsersCurrent): NamesAttachedReactionsList {
  let updatedReactions: NamesAttachedReactionsList = old ? mapValues(old,
    (reactionsByType: UserReactInfo[]) => (
      reactionsByType.filter(userIdAndName => userIdAndName.userId !== currentUser._id)
    )
  ) : {};
  return updatedReactions;
}

