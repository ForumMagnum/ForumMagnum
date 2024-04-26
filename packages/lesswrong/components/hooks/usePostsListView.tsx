import React, { FC, ReactNode, createContext, useContext, useState } from "react";
import { TupleSet, UnionOf } from "../../lib/utils/typeGuardUtils";

const postsListViewTypes = new TupleSet(["list", "card"] as const);

export type PostsListViewType = UnionOf<typeof postsListViewTypes>;

export const isPostsListViewType = (value: string): value is PostsListViewType =>
  postsListViewTypes.has(value);

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
