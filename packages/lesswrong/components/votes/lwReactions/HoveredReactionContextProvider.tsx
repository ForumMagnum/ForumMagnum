import React, { useState } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';

export type HoveredReactionContextType = {
  hovered: string[]
  setReactionIsHovered: (reactionName: string, isHovered: boolean) => void
};
export const HoveredReactionContext = React.createContext<HoveredReactionContextType|null>(null);

export const HoveredReactionContextProvider = ({children}: {
  children: React.ReactNode,
}) => {
  const [hoveredReactions,setHoveredReactions] = useState<string[]>([]);

  const setReactionIsHovered = (reactionName: string, isHovered: boolean) => {
    if (isHovered && !hoveredReactions.find(r=>r===reactionName)) {
      setHoveredReactions([...hoveredReactions, reactionName]);
    }
    if (!isHovered && hoveredReactions.find(r=>r===reactionName)) {
      setHoveredReactions(hoveredReactions.filter(r=>r!==reactionName));
    }
  }
  
  const hoveredReactionContext = {
    hovered: hoveredReactions,
    setReactionIsHovered: setReactionIsHovered
  };
  
  return <HoveredReactionContext.Provider value={hoveredReactionContext}>
    {children}
  </HoveredReactionContext.Provider>
}

const HoveredReactionContextProviderComponent = registerComponent('HoveredReactionContextProvider', HoveredReactionContextProvider);

declare global {
  interface ComponentTypes {
    HoveredReactionContextProvider: typeof HoveredReactionContextProviderComponent
  }
}

