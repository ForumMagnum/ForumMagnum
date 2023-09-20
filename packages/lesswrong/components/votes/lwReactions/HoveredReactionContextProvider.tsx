import React, { useReducer } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';

/**
 * A list of reaction-types whose buttons are hovered. Passed around as a
 * context (from HoveredReactionContextProvider, used in CommentsItem) so that
 * if you hover over reaction icons in a comment footer, the corresponding
 * reaction inside a comment will be highlighted.
 */
export const HoveredReactionListContext = React.createContext<string[]|null>(null);

/**
 * A callback function for reporting that a reaction-type has been hovered or
 * unhovered. This is separated from HoveredReactionListContext so that the
 * reaction buttons, which write the hover-state but don't read it, don't have
 * the context change under them and cause a rerender in the middle of
 * hover/unhover events.
 */
export const SetHoveredReactionContext = React.createContext<((change: HoveredReactionChange)=>void)|null>(null);

type HoveredReactionChange = {
  reactionName:string,
  isHovered:boolean,
};

function hoveredReactionsReducer(hoveredReactions: string[], change: HoveredReactionChange): string[] {
  if (change.isHovered && !hoveredReactions.find(r=>r===change.reactionName)) {
    return [...hoveredReactions, change.reactionName];
  } else if (!change.isHovered && hoveredReactions.find(r=>r===change.reactionName)) {
    return (hoveredReactions.filter(r=>r!==change.reactionName));
  } else {
    return hoveredReactions;
  }
}

export const HoveredReactionContextProvider = ({children}: {
  children: React.ReactNode,
}) => {
  const [hoveredReactions,dispatch] = useReducer(hoveredReactionsReducer, []);

  return <HoveredReactionListContext.Provider value={hoveredReactions}>
    <SetHoveredReactionContext.Provider value={dispatch}>
      {children}
    </SetHoveredReactionContext.Provider>
  </HoveredReactionListContext.Provider>
}

const HoveredReactionContextProviderComponent = registerComponent('HoveredReactionContextProvider', HoveredReactionContextProvider);

declare global {
  interface ComponentTypes {
    HoveredReactionContextProvider: typeof HoveredReactionContextProviderComponent
  }
}

