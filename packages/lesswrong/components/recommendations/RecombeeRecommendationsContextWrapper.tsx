import React, { createContext, useMemo } from "react";


type RecombeeRecommendationsContextType = {
  postId: string,
  recommId: string|undefined,
}

export const RecombeeRecommendationsContext = createContext<RecombeeRecommendationsContextType|null>(null);

export const RecombeeRecommendationsContextWrapper = ({postId, recommId, children}: {postId: string, recommId?: string, children: React.ReactNode}) => {
  const context = useMemo(() => ({recommId, postId}), [recommId, postId]);
  return <RecombeeRecommendationsContext.Provider value={context}>
    {children}
  </RecombeeRecommendationsContext.Provider>
}
