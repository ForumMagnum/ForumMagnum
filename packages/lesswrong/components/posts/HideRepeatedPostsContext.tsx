import React, { createContext, useContext } from "react";

export type HideRepeatedPostsPayload = {
  isPostRepeated: (postId: string) => boolean,
  addPost: (postId: string) => void,
}

const HideRepeatedPostsContext = createContext<HideRepeatedPostsPayload>({
  isPostRepeated: (postId: string) => false,
  addPost: (postId: string) => {},
});

export const useHideRepeatedPosts = () => useContext(HideRepeatedPostsContext);

export const HideRepeatedPostsProvider = ({children}) => {
  const postIds: string[] = [];

  const isPostRepeated = (postId: string) => postIds.indexOf(postId) >= 0;
  const addPost = (postId: string) => postIds.push(postId);

  return (
    <HideRepeatedPostsContext.Provider value={{isPostRepeated, addPost}}>
      {children}
    </HideRepeatedPostsContext.Provider>
  );
}
