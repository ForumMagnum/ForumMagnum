import React, { useReducer } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { QuoteLocator } from '@/lib/voting/namesAttachedReactions';
import type { VotingProps } from '../votingProps';

/**
 * A list of reaction-types whose buttons are hovered. Passed around as a
 * context (from HoveredReactionContextProvider, used in CommentsItem) so that
 * if you hover over reaction icons in a comment footer, the corresponding
 * reaction inside a comment will be highlighted.
 */
export const HoveredReactionListContext = React.createContext<HoveredReaction[]|null>(null);

/**
 * A callback function for reporting that a reaction-type has been hovered or
 * unhovered. This is separated from HoveredReactionListContext so that the
 * reaction buttons, which write the hover-state but don't read it, don't have
 * the context change under them and cause a rerender in the middle of
 * hover/unhover events.
 */
export const SetHoveredReactionContext = React.createContext<((change: HoveredReactionChange) => void)|null>(null);

export const InlineReactVoteContext = React.createContext<VotingProps<VoteableTypeClient>|null>(null);

type HoveredReactionChange = {
  reactionName: string,
  quote: QuoteLocator | null,
  isHovered: boolean,
};

type HoveredReaction = {
  reactionName: string,
  quote: QuoteLocator | null,
};

function hoveredReactionsReducer(hoveredReactions: HoveredReaction[], change: HoveredReactionChange): HoveredReaction[] {
  if (change.isHovered && !hoveredReactions.find(r=>r.reactionName===change.reactionName && r.quote===change.quote)) {
    return [...hoveredReactions, { reactionName: change.reactionName, quote: change.quote }];
  } else if (!change.isHovered && hoveredReactions.find(r=>r.reactionName===change.reactionName && r.quote===change.quote)) {
    return (hoveredReactions.filter(r=>r.reactionName!==change.reactionName || r.quote!==change.quote));
  } else {
    return hoveredReactions;
  }
}

export const HoveredReactionContextProvider = ({voteProps, children}: {
  voteProps: VotingProps<VoteableTypeClient>
  children: React.ReactNode,
}) => {
  const [hoveredReactions,dispatch] = useReducer(hoveredReactionsReducer, []);

  return <HoveredReactionListContext.Provider value={hoveredReactions}>
    <InlineReactVoteContext.Provider value={voteProps}>
    <SetHoveredReactionContext.Provider value={dispatch}>
      {children}
    </SetHoveredReactionContext.Provider>
    </InlineReactVoteContext.Provider>
  </HoveredReactionListContext.Provider>
}

const HoveredReactionContextProviderComponent = registerComponent('HoveredReactionContextProvider', HoveredReactionContextProvider);

declare global {
  interface ComponentTypes {
    HoveredReactionContextProvider: typeof HoveredReactionContextProviderComponent
  }
}

export default HoveredReactionContextProviderComponent;

