import type { VotingProps } from '@/components/votes/votingProps';
import type { NamesAttachedReactionsList, EmojiReactName, NamesAttachedReactionsScore, UserReactInfo, NamesAttachedReactionsVote, UserVoteOnSingleReaction } from './namesAttachedReactions';
import sumBy from 'lodash/sumBy';
import some from 'lodash/some';
import sortBy from 'lodash/sortBy';
import mapValues from 'lodash/mapValues';
import type { ContentReplacedSubstringComponentInfo } from '@/components/common/ContentItemBody';

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

  function normalizeReactsList(reacts: UserReactInfo[] | undefined): UserReactInfo[] {
    if (!reacts) return [];
    let normalizedReacts: UserReactInfo[] = [];
    for (let react of reacts) {
      if (!react.quotes || react.quotes.length <= 1) {
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

export function getNormalizedUserVoteFromVoteProps(voteProps: VotingProps<VoteableTypeClient>): NamesAttachedReactionsVote | undefined {
  const extendedVote = (voteProps.document?.currentUserExtendedVote) as NamesAttachedReactionsVote | undefined;
  if (!extendedVote) return undefined;

  let normalizedReacts: UserVoteOnSingleReaction[] = [];
  if (extendedVote.reacts) {
    for (let react of extendedVote.reacts) {
      if (!react.quotes || react.quotes.length <= 1) {
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
}export function getDocumentHighlights(voteProps: VotingProps<VoteableTypeClient>): ContentReplacedSubstringComponentInfo[] {
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

