import React, { createContext, useContext } from "react";


type RecombeeRecommendationsContextType = {
  postId: string,
  recommId: string|undefined,
}

export const RecombeeRecommendationsContext = createContext<RecombeeRecommendationsContextType|null>(null);

export const RecombeeRecommendationsContextWrapper = ({postId, recommId, children}: {postId: string, recommId?: string, children: React.ReactNode}) => {
  return <RecombeeRecommendationsContext.Provider value={{recommId, postId}}>
    {children}
  </RecombeeRecommendationsContext.Provider>
}
