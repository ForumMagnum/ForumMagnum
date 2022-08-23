import React, { createContext, useContext, useRef } from "react";

export type HideRepeatedPostsPayload = {
  isPostRepeated: (ownerId: string, postId: string) => boolean,
  addPost: (ownerId: string, postId: string) => void,
}

const HideRepeatedPostsContext = createContext<HideRepeatedPostsPayload>({
  isPostRepeated: (ownerId: string, postId: string) => false,
  addPost: (ownerId: string, postId: string) => {},
});

export const useHideRepeatedPosts = () => {
  const id = useRef("hrp" + Math.floor(Math.random() * 1e8));
  const {isPostRepeated, addPost} = useContext(HideRepeatedPostsContext);
  return {
    isPostRepeated: isPostRepeated.bind(null, id.current),
    addPost: addPost.bind(null, id.current),
  };
}

export const HideRepeatedPostsProvider = ({children}) => {
  const postIds: Record<string, string> = {};

  const isPostRepeated = (ownerId: string, postId: string) =>
    !!postIds[postId] && postIds[postId] !== ownerId;
  const addPost = (ownerId: string, postId: string) =>
    postIds[postId] = ownerId;

  return (
    <HideRepeatedPostsContext.Provider value={{isPostRepeated, addPost}}>
      {children}
    </HideRepeatedPostsContext.Provider>
  );
}
