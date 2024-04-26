import React, { FC, ReactNode, createContext, useContext, useState } from "react";
import type { PostsListViewType } from "../posts/usePostsItem";

type PostsListViewContext = {
  view: PostsListViewType,
  setView: (view: PostsListViewType) => void,
}

const postsListViewContext = createContext<PostsListViewContext>({
  view: "list",
  // eslint-disable-next-line
  setView: () => console.error("Can't set view outside of PostsListViewProvider"),
});

export const PostsListViewProvider: FC<{children: ReactNode}> = ({children}) => {
  const [view, setView] = useState<PostsListViewType>("list");
  return (
    <postsListViewContext.Provider value={{view, setView}}>
      {children}
    </postsListViewContext.Provider>
  );
}

export const usePostsListView = () => useContext(postsListViewContext);
